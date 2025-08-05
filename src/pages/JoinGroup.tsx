import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, Gift, MessageCircle, AlertCircle, CheckCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingStates";
import { Validator } from "@/lib/validation";
import { ErrorHandler } from "@/lib/errorHandler";

interface Group {
  id: string;
  name: string;
  description: string;
}

interface FormErrors {
  name?: string;
  birthday?: string;
  whatsapp_number?: string;
  likes?: string;
  gift_wishes?: string;
}

const JoinGroup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteCode = searchParams.get('invite');
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [fieldStatus, setFieldStatus] = useState<Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>>({});
  const { toast } = useToast();
  
  // Member data form with persistence
  const [memberData, setMemberData] = useState(() => {
    // Try to restore data from localStorage
    if (inviteCode) {
      const savedData = localStorage.getItem(`joinGroup_${inviteCode}`);
      if (savedData) {
        try {
          return JSON.parse(savedData);
        } catch (e) {
          console.error('Error parsing saved data:', e);
        }
      }
    }
    return {
      name: "",
      birthday: "",
      likes: "",
      gift_wishes: "",
      whatsapp_number: ""
    };
  });

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (inviteCode && memberData.name) {
      localStorage.setItem(`joinGroup_${inviteCode}`, JSON.stringify(memberData));
    }
  }, [memberData, inviteCode]);

  // Clear saved data when component unmounts or on successful join
  useEffect(() => {
    return () => {
      if (inviteCode) {
        localStorage.removeItem(`joinGroup_${inviteCode}`);
      }
    };
  }, [inviteCode]);

  // Real-time validation
  const validateField = (field: string, value: string) => {
    const errors: FormErrors = {};
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Name is required';
          setFieldStatus(prev => ({ ...prev, name: 'invalid' }));
        } else if (value.length < 2) {
          errors.name = 'Name must be at least 2 characters';
          setFieldStatus(prev => ({ ...prev, name: 'invalid' }));
        } else {
          setFieldStatus(prev => ({ ...prev, name: 'valid' }));
        }
        break;
      case 'birthday':
        if (!value) {
          errors.birthday = 'Birthday is required';
          setFieldStatus(prev => ({ ...prev, birthday: 'invalid' }));
        } else {
          const validation = Validator.validateBirthday(value);
          if (!validation.isValid) {
            errors.birthday = validation.errors[0];
            setFieldStatus(prev => ({ ...prev, birthday: 'invalid' }));
          } else {
            setFieldStatus(prev => ({ ...prev, birthday: 'valid' }));
          }
        }
        break;
      case 'whatsapp_number':
        if (!value) {
          errors.whatsapp_number = 'WhatsApp number is required';
          setFieldStatus(prev => ({ ...prev, whatsapp_number: 'invalid' }));
        } else {
          const validation = Validator.validatePhoneNumber(value);
          if (!validation.isValid) {
            errors.whatsapp_number = validation.errors[0];
            setFieldStatus(prev => ({ ...prev, whatsapp_number: 'invalid' }));
          } else {
            setFieldStatus(prev => ({ ...prev, whatsapp_number: 'valid' }));
          }
        }
        break;
    }
    
    return errors;
  };

  // Handle field changes with validation
  const handleFieldChange = (field: string, value: string) => {
    setMemberData(prev => ({ ...prev, [field]: value }));
    
    // Clear previous error for this field
    setFormErrors(prev => ({ ...prev, [field]: undefined }));
    
    // Validate field if it has a value
    if (value.trim()) {
      const fieldErrors = validateField(field, value);
      setFormErrors(prev => ({ ...prev, ...fieldErrors }));
    } else {
      setFieldStatus(prev => ({ ...prev, [field]: 'idle' }));
    }
  };

  useEffect(() => {
    if (inviteCode) {
      fetchGroupInfo();
    } else {
      toast({
        title: "Invalid Link",
        description: "No invite code found in the URL",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [inviteCode]);

  const fetchGroupInfo = async () => {
    try {
      setLoading(true);
      console.log("Fetching group info for invite code:", inviteCode);
      
      const { data: group, error } = await supabase
        .from("groups")
        .select("id, name, description")
        .eq("invite_code", inviteCode)
        .is("deactivated_at", null) // Only active groups
        .maybeSingle();

      console.log("Group query result:", { group, error });

      if (error || !group) {
        console.error("Group not found or error:", error);
        const appError = ErrorHandler.handleError(error || new Error("Invalid invite code or group no longer exists"));
        toast({
          title: appError.userMessage,
          description: appError.action,
          variant: appError.severity === 'error' ? 'destructive' : 'default',
        });
        navigate('/');
        return;
      }

      console.log("Group found:", group);
      setGroup(group);
    } catch (error: any) {
      console.error("Fetch group info error:", error);
      const appError = ErrorHandler.handleError(error);
      toast({
        title: appError.userMessage,
        description: appError.action,
        variant: appError.severity === 'error' ? 'destructive' : 'default',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const joinGroupAnonymously = async () => {
    try {
      if (!group) throw new Error("Group information not found");

      // Validate all required fields before submission
      const requiredFields = ['name', 'birthday', 'whatsapp_number'];
      const validationErrors: FormErrors = {};
      
      requiredFields.forEach(field => {
        const value = memberData[field as keyof typeof memberData];
        if (!value || (typeof value === 'string' && !value.trim())) {
          validationErrors[field as keyof FormErrors] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        }
      });

      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        toast({
          title: "Please complete all required fields",
          description: "Please fill in all required fields before joining the group",
          variant: "destructive",
        });
        return;
      }

      setJoining(true);

      // Check if someone with the same WhatsApp number already exists in this group
      const { data: existingMember } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", group.id)
        .eq("whatsapp_number", memberData.whatsapp_number)
        .maybeSingle();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "Someone with this WhatsApp number is already in this group",
        });
        return;
      }

      // Also check if the current authenticated user is already a member
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existingUserMember } = await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", group.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingUserMember) {
          toast({
            title: "Already a member",
            description: "You are already a member of this group",
          });
          return;
        }
      }

      // Add member to group without user_id (anonymous)
      const { data: newMember, error } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: user?.id || null, // Use authenticated user ID if available
          name: memberData.name,
          birthday: memberData.birthday,
          likes: memberData.likes,
          gift_wishes: memberData.gift_wishes,
          whatsapp_number: memberData.whatsapp_number
        })
        .select()
        .single();

      if (error) {
        const appError = ErrorHandler.handleError(error);
        toast({
          title: appError.userMessage,
          description: appError.action,
          variant: appError.severity === 'error' ? 'destructive' : 'default',
        });
        return;
      }

      // Store anonymous group membership info in localStorage
      const anonymousGroups = JSON.parse(localStorage.getItem('anonymousGroups') || '[]');
      anonymousGroups.push({
        groupId: group.id,
        groupName: group.name,
        memberId: newMember.id,
        whatsappNumber: memberData.whatsapp_number
      });
      localStorage.setItem('anonymousGroups', JSON.stringify(anonymousGroups));

      // Clear saved form data since join was successful
      if (inviteCode) {
        localStorage.removeItem(`joinGroup_${inviteCode}`);
      }

      // Send WhatsApp confirmation message
      try {
        const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp-message', {
          body: {
            template: {
              phone_number: memberData.whatsapp_number,
              template_name: 'welcome_birthday',
              language: 'es_AR',
              template_parameters: [memberData.name]
            },
            templateId: '578b0acd-e167-4f27-be4d-10922344dd10'
          }
        });

        if (whatsappError) {
          console.error('WhatsApp message error:', whatsappError);
        }
      } catch (whatsappError: any) {
        console.error('WhatsApp message error:', whatsappError);
      }

      setShowSuccessDialog(true);
      setJoining(false);

    } catch (error: any) {
      console.error("Join group error:", error);
      const appError = ErrorHandler.handleError(error);
      toast({
        title: appError.userMessage,
        description: appError.action,
        variant: appError.severity === 'error' ? 'destructive' : 'default',
      });
      setJoining(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    
    try {
      // Join group anonymously without requiring authentication
      await joinGroupAnonymously();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const handleGoToGroup = () => {
    // Store context and redirect to auth to see the group they joined
    sessionStorage.setItem('auth_context', 'join');
    sessionStorage.setItem('redirect_to', '/my-groups');
    navigate('/auth?context=join');
  };

  const handleCreateAccount = () => {
    // Store context and redirect to auth to create their own group
    sessionStorage.setItem('auth_context', 'create');
    sessionStorage.setItem('redirect_to', '/create-group');
    navigate('/auth?context=create');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-celebration/5 to-birthday/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <LoadingSpinner 
              size="lg" 
              text="Finding your group..." 
              className="mt-4" 
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join {group.name}</CardTitle>
          {group.description && (
            <CardDescription className="text-center">
              {group.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name *</Label>
              <div className="relative">
                <Input
                  id="name"
                  value={memberData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Your full name"
                  required
                  className={`${fieldStatus.name === 'valid' ? 'border-green-500 focus:border-green-500' : ''} ${fieldStatus.name === 'invalid' ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {fieldStatus.name === 'valid' && (
                  <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
                {fieldStatus.name === 'invalid' && (
                  <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
              {fieldStatus.name === 'invalid' && formErrors.name && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.name}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday *</Label>
              <div className="relative">
                <Input
                  id="birthday"
                  type="date"
                  value={memberData.birthday}
                  onChange={(e) => handleFieldChange('birthday', e.target.value)}
                  required
                  className={`${fieldStatus.birthday === 'valid' ? 'border-green-500 focus:border-green-500' : ''} ${fieldStatus.birthday === 'invalid' ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                {fieldStatus.birthday === 'valid' && (
                  <CheckCircle className="absolute right-8 top-3 h-4 w-4 text-green-500" />
                )}
                {fieldStatus.birthday === 'invalid' && (
                  <AlertCircle className="absolute right-8 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
              {fieldStatus.birthday === 'invalid' && formErrors.birthday && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.birthday}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="likes">What do you like?</Label>
              <Input
                id="likes"
                value={memberData.likes}
                onChange={(e) => handleFieldChange('likes', e.target.value)}
                placeholder="e.g., coffee, books, music..."
                className={`${fieldStatus.likes === 'valid' ? 'border-green-500 focus:border-green-500' : ''} ${fieldStatus.likes === 'invalid' ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {fieldStatus.likes === 'invalid' && formErrors.likes && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.likes}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gift_wishes">Gift wishes (optional)</Label>
              <div className="relative">
                <Input
                  id="gift_wishes"
                  value={memberData.gift_wishes}
                  onChange={(e) => handleFieldChange('gift_wishes', e.target.value)}
                  placeholder="What would you like as a gift?"
                  className={`${fieldStatus.gift_wishes === 'valid' ? 'border-green-500 focus:border-green-500' : ''} ${fieldStatus.gift_wishes === 'invalid' ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                <Gift className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                {fieldStatus.gift_wishes === 'invalid' && formErrors.gift_wishes && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.gift_wishes}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number *</Label>
              <div className="relative">
                <PhoneInput
                  id="whatsapp"
                  value={memberData.whatsapp_number}
                  onChange={(value) => handleFieldChange('whatsapp_number', value)}
                  placeholder="Phone number"
                  required
                  className={`${fieldStatus.whatsapp_number === 'valid' ? 'border-green-500 focus:border-green-500' : ''} ${fieldStatus.whatsapp_number === 'invalid' ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {fieldStatus.whatsapp_number === 'valid' && (
                  <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
                {fieldStatus.whatsapp_number === 'invalid' && (
                  <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Include country and zone code for WhatsApp notifications: +5411AAAABBBB
              </p>
              {fieldStatus.whatsapp_number === 'invalid' && formErrors.whatsapp_number && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.whatsapp_number}
                </p>
              )}
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">
                💡 No account needed! You can join now and create an account later to manage your groups.
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={joining}>
              {joining ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" text="" />
                  Joining...
                </div>
              ) : (
                "Join Group"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogDescription className="text-center space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                <p className="font-medium text-green-800 mb-2 flex items-center justify-center gap-2">
                  <span className="animate-pulse">🎉</span>
                  You've successfully joined "{group?.name}"!
                  <span className="animate-pulse">🎉</span>
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-blue-600 animate-bounce" />
                  <p className="font-medium text-blue-800">
                    WhatsApp Confirmation
                  </p>
                </div>
                <p className="text-sm text-blue-700">
                  📱 We're sending you a confirmation message on WhatsApp right now! Check your messages in a few moments.
                </p>
              </div>
              
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleGoToGroup}
                  className="w-full"
                >
                  Create User to View/Create Groups
                </Button>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Didn't receive the confirmation?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open('https://wa.me/541154191677?text=Hello,%20I%20didn\'t%20receive%20the%20group%20confirmation%20message', '_blank');
                  }}
                  className="w-full"
                >
                  📞 Contact us on WhatsApp
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JoinGroup;