import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, ExternalLink, CheckCircle } from "lucide-react";

interface PlugitConfig {
  serverUrl: string;
  authMethod: 'none' | 'bearer' | 'oauth2';
  bearerToken?: string;
  endpoints: Array<{
    name: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  }>;
}

const PlugitIntegration = () => {
  const [config, setConfig] = useState<PlugitConfig>({
    serverUrl: "",
    authMethod: 'none',
    bearerToken: "",
    endpoints: []
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const handleSaveConfig = async () => {
    try {
      // Test connection to the plugit.chat agent
      const testUrl = `${config.serverUrl}/health`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (config.authMethod === 'bearer' && config.bearerToken) {
        headers.Authorization = `Bearer ${config.bearerToken}`;
      }

      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
        mode: 'cors'
      });

      if (response.ok) {
        setIsConnected(true);
        setIsConfigOpen(false);
        toast({
          title: "Connected Successfully! 🎉",
          description: "Plugit.chat agent is now connected and ready to send birthday reminders",
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to the Plugit.chat agent. Please check your configuration.",
        variant: "destructive",
      });
    }
  };

  const addEndpoint = () => {
    setConfig(prev => ({
      ...prev,
      endpoints: [...prev.endpoints, { name: "", path: "", method: 'POST' }]
    }));
  };

  const updateEndpoint = (index: number, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      endpoints: prev.endpoints.map((endpoint, i) => 
        i === index ? { ...endpoint, [field]: value } : endpoint
      )
    }));
  };

  const removeEndpoint = (index: number) => {
    setConfig(prev => ({
      ...prev,
      endpoints: prev.endpoints.filter((_, i) => i !== index)
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Plugit.chat Integration
          {isConnected && <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>}
        </CardTitle>
        <CardDescription>
          Connect your birthday reminder system to Plugit.chat for automated WhatsApp notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="font-medium">Agent Status</p>
            <p className="text-sm text-muted-foreground">
              {isConnected ? "Connected to Plugit.chat agent" : "Not connected"}
            </p>
          </div>
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger asChild>
              <Button variant={isConnected ? "outline" : "default"}>
                {isConnected ? "Reconfigure" : "Configure"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configure Plugit.chat Agent</DialogTitle>
                <DialogDescription>
                  Set up the connection to your Plugit.chat agent for automated birthday reminders
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="server-url">Server URL *</Label>
                  <Input
                    id="server-url"
                    value={config.serverUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, serverUrl: e.target.value }))}
                    placeholder="https://plugit.chat/agents/n1zmFi50hku5V2xHhHF5"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your Plugit.chat agent URL
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Authentication Method</Label>
                  <div className="flex gap-2">
                    {(['none', 'bearer', 'oauth2'] as const).map((method) => (
                      <Button
                        key={method}
                        variant={config.authMethod === method ? "default" : "outline"}
                        size="sm"
                        onClick={() => setConfig(prev => ({ ...prev, authMethod: method }))}
                        disabled={method === 'oauth2'}
                      >
                        {method === 'none' ? 'None' : method === 'bearer' ? 'Bearer Token' : 'OAuth2 (coming soon)'}
                      </Button>
                    ))}
                  </div>
                </div>

                {config.authMethod === 'bearer' && (
                  <div className="space-y-2">
                    <Label htmlFor="bearer-token">Bearer Token</Label>
                    <Input
                      id="bearer-token"
                      type="password"
                      value={config.bearerToken}
                      onChange={(e) => setConfig(prev => ({ ...prev, bearerToken: e.target.value }))}
                      placeholder="Enter your bearer token"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>API Endpoints</Label>
                    <Button variant="outline" size="sm" onClick={addEndpoint}>
                      Add Endpoint
                    </Button>
                  </div>
                  
                  {config.endpoints.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p>No endpoints configured</p>
                      <p className="text-xs">Add endpoints to enable specific functionality</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {config.endpoints.map((endpoint, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Input
                              placeholder="Endpoint name"
                              value={endpoint.name}
                              onChange={(e) => updateEndpoint(index, 'name', e.target.value)}
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              placeholder="/api/endpoint"
                              value={endpoint.path}
                              onChange={(e) => updateEndpoint(index, 'path', e.target.value)}
                            />
                          </div>
                          <select
                            value={endpoint.method}
                            onChange={(e) => updateEndpoint(index, 'method', e.target.value)}
                            className="px-3 py-2 border rounded-md"
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeEndpoint(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveConfig}>
                    Save Configuration
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isConnected && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Integration Features:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Automated birthday reminders via WhatsApp</li>
              <li>• Gift suggestion AI based on member preferences</li>
              <li>• Group notification scheduling</li>
              <li>• Custom message templates</li>
            </ul>
            <Button variant="outline" size="sm" className="mt-2">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Plugit.chat Dashboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlugitIntegration;