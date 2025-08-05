import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Calendar, Settings, Heart, Copy, MessageCircle, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UserMenu from "@/components/UserMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseBirthdayDate, formatBirthdayDate, isBirthdayToday } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  created_at: string;
  created_by: string;
}

interface GroupMember {
  id: string;
  name: string;
  birthday: string;
  likes: string;
  gift_wishes?: string;
  whatsapp_number: string;
  user_id?: string;
}

interface UpcomingBirthday {
  id: string;
  name: string;
  birthday: string;
  daysUntil: number;
  isToday: boolean;
}

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthday[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadGroupData(id);
    }
  }, [id]);

  const loadGroupData = async (groupId: string) => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setCurrentUser(user);

      // Load group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);
      setIsAdmin(user?.id === groupData.created_by);

      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Calculate upcoming birthdays
      calculateUpcomingBirthdays(membersData || []);

    } catch (error: any) {
      console.error("Error loading group:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el grupo",
        variant: "destructive",
      });
      navigate("/groups");
    } finally {
      setLoading(false);
    }
  };

  const calculateUpcomingBirthdays = (members: GroupMember[]) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    console.log('Calculating birthdays for date:', today.toISOString().split('T')[0]);
    
    const birthdays = members.map(member => {
      // Parse birthday string manually to avoid timezone issues
      const memberBirthday = parseBirthdayDate(member.birthday);
      
      console.log(`Processing ${member.name}: birthday ${member.birthday}, parsed as ${memberBirthday.toISOString().split('T')[0]}`);
      
      // Create birthday for this year
      let nextBirthday = new Date(currentYear, memberBirthday.getMonth(), memberBirthday.getDate());
      
      // If birthday already passed this year, use next year
      if (nextBirthday < today) {
        nextBirthday = new Date(currentYear + 1, memberBirthday.getMonth(), memberBirthday.getDate());
      }
      
      const timeDiff = nextBirthday.getTime() - today.getTime();
      const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const isToday = isBirthdayToday(member.birthday);
      
      console.log(`${member.name}: nextBirthday=${nextBirthday.toISOString().split('T')[0]}, daysUntil=${daysUntil}, isToday=${isToday}`);
      
      return {
        id: member.id,
        name: member.name,
        birthday: member.birthday,
        daysUntil,
        isToday
      };
    })
    .filter(birthday => birthday.daysUntil <= 35) // Only show birthdays within 35 days
    .sort((a, b) => {
      // Sort by priority: today's birthdays first, then by days until
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;
      return a.daysUntil - b.daysUntil;
    });

    // Show all birthdays within 35 days (no limit on count)
    setUpcomingBirthdays(birthdays);
    
    // Debug: Log today's date and birthday calculations
    console.log('Today:', today.toISOString().split('T')[0]);
    console.log('Upcoming birthdays:', birthdays);
    console.log('Luca Mag birthday check:', birthdays.find(b => b.name === 'Luca Mag'));
    console.log('Today birthdays:', birthdays.filter(b => b.isToday));
    console.log('isBirthdayToday test for Luca Mag:', isBirthdayToday('1990-08-05'));
  };

  const copyInviteLink = () => {
    if (!group) return;
    const inviteUrl = `${window.location.origin}/join?invite=${group.invite_code}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "¡Copiado!",
      description: "Enlace de invitación copiado al portapapeles",
    });
  };

  const shareOnWhatsApp = () => {
    if (!group) return;
    const inviteUrl = `${window.location.origin}/join?invite=${group.invite_code}`;
    const message = `🎉 ¡Únete a mi grupo de cumpleaños "${group.name}"!\n\nHaz clic en este enlace para unirte y nunca te olvides de un cumpleaños:\n${inviteUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Cargando grupo...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Grupo no encontrado</h2>
          <Button onClick={() => navigate("/groups")}>
            Volver a mis grupos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/groups")}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <UserMenu />
        </div>

        {/* Group Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                <p className="text-gray-600">
                  {isAdmin ? "Administrador" : "Miembro"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="text-gray-500 hover:text-gray-700"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white py-3 h-auto"
              >
                <Users className="w-5 h-5 mr-2" />
                Invitar amigos
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={shareOnWhatsApp}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Compartir por WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyInviteLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar enlace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            onClick={() => navigate(`/groups/${id}/calendar`)}
            className="border-gray-300 hover:bg-gray-50 py-3 h-auto"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Ver calendario
          </Button>
        </div>

        {/* Today's Birthday - Special Section */}
        {upcomingBirthdays.some(b => b.isToday) && (
          <Card className="mb-6 border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 bg-yellow-400 rounded-full">
                  <span className="text-white text-sm">🎂</span>
                </div>
                <CardTitle className="text-lg text-orange-800">¡Cumpleaños de Hoy!</CardTitle>
              </div>
              <p className="text-sm text-orange-600">¡No te olvides de felicitar!</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingBirthdays.filter(b => b.isToday).map((birthday) => {
                  const member = members.find(m => m.id === birthday.id);
                  return (
                    <div 
                      key={birthday.id} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-lg shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-yellow-400 rounded-full">
                          <span className="text-white text-xl">🎉</span>
                        </div>
                        <div>
                          <p className="font-bold text-lg text-orange-800">
                            {birthday.name}
                          </p>
                          <p className="text-sm text-orange-600 font-medium">
                            ¡Hoy es su cumpleaños! 🎂
                          </p>
                          {member?.likes && (
                            <p className="text-xs text-orange-500 mt-1">
                              <strong>Gustos:</strong> {member.likes}
                            </p>
                          )}
                          {member?.gift_wishes && (
                            <p className="text-xs text-orange-500">
                              <strong>Deseos:</strong> {member.gift_wishes}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant="default"
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1"
                      >
                        {formatBirthdayDate(birthday.birthday, 'es-ES', { day: 'numeric', month: 'short' })}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Birthdays - Regular Section */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-lg">Próximos cumpleaños</CardTitle>
            </div>
            <p className="text-sm text-gray-600">Los siguientes cumpleaños en tu grupo</p>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.filter(b => !b.isToday).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay más cumpleaños próximos
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBirthdays.filter(b => !b.isToday).map((birthday) => (
                  <div 
                    key={birthday.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{birthday.name}</p>
                      <p className="text-sm text-gray-600">
                        En {birthday.daysUntil} días
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {formatBirthdayDate(birthday.birthday, 'es-ES', { day: 'numeric', month: 'short' })}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Group Members */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Miembros del grupo</CardTitle>
              <Badge variant="secondary">{members.length} personas</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.whatsapp_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatBirthdayDate(member.birthday, 'es-ES', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay miembros en este grupo aún
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupDetail; 