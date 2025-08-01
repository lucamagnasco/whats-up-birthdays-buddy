import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Check, AlertCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const KapsoIntegration = () => {
  const [apiKey, setApiKey] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('user_id', session.session.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setApiKey(data.api_key);
        setPhoneNumber(data.phone_number);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!apiKey.trim() || !phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      // First, deactivate any existing configurations
      await supabase
        .from('whatsapp_config')
        .update({ is_active: false })
        .eq('user_id', session.session.user.id);

      // Then insert the new configuration
      const { error } = await supabase
        .from('whatsapp_config')
        .insert({
          user_id: session.session.user.id,
          api_key: apiKey,
          phone_number: phoneNumber,
          is_active: true
        });

      if (error) throw error;

      setIsConnected(true);
      toast({
        title: "Success",
        description: "Kapso configuration saved successfully",
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    try {
      const response = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          template: {
            phone_number: phoneNumber,
            template_name: "test_template",
            language: "en",
            template_parameters: ["Test"]
          }
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Test Successful",
        description: "WhatsApp connection is working properly",
      });
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: "Test Failed",
        description: "Could not send test message. Check your configuration.",
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Kapso WhatsApp Integration
          {isConnected && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Configure Kapso to send automated WhatsApp birthday reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="apiKey">Kapso API Key</Label>
          <Input
            id="apiKey"
            type="password"
            placeholder="Enter your Kapso API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">WhatsApp Business Phone Number</Label>
          <PhoneInput
            id="phoneNumber"
            placeholder="Phone number"
            value={phoneNumber}
            onChange={(value) => setPhoneNumber(value)}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSaveConfiguration}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Configuration"}
          </Button>
          
          {isConnected && (
            <Button 
              onClick={handleTestConnection}
              variant="outline"
              disabled={testLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Requirements:
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Active Kapso account with WhatsApp Business API</li>
            <li>• Pre-approved message templates in Meta</li>
            <li>• Valid WhatsApp Business phone number</li>
            <li>• Kapso API key from your dashboard</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default KapsoIntegration;