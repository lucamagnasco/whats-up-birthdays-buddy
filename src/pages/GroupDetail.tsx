import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Calendar, Settings, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UserMenu from "@/components/UserMenu";

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
    
    const birthdays = members.map(member => {
      const memberBirthday = new Date(member.birthday);
      
      // Create birthday for this year
      let nextBirthday = new Date(currentYear, memberBirthday.getMonth(), memberBirthday.getDate());
      
      // If birthday already passed this year, use next year
      if (nextBirthday < today) {
        nextBirthday = new Date(currentYear + 1, memberBirthday.getMonth(), memberBirthday.getDate());
      }
      
      const timeDiff = nextBirthday.getTime() - today.getTime();
      const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const isToday = daysUntil === 0;
      
      return {
        id: member.id,
        name: member.name,
        birthday: member.birthday,
        daysUntil,
        isToday
      };
    }).sort((a, b) => a.daysUntil - b.daysUntil);

    // Only show next 3 upcoming birthdays
    setUpcomingBirthdays(birthdays.slice(0, 3));
  };

  const formatBirthdayDate = (birthday: string) => {
    const date = new Date(birthday);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    });
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
              onClick={() => navigate(`/groups/${id}/settings`)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            onClick={shareOnWhatsApp}
            className="bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white py-3 h-auto"
          >
            <Users className="w-5 h-5 mr-2" />
            Invitar amigos
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/groups/${id}/calendar`)}
            className="border-gray-300 hover:bg-gray-50 py-3 h-auto"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Ver calendario
          </Button>
        </div>

        {/* Next Birthdays */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-lg">Próximos cumpleaños</CardTitle>
            </div>
            <p className="text-sm text-gray-600">Los siguientes cumpleaños en tu grupo</p>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay cumpleaños próximos
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBirthdays.map((birthday) => (
                  <div key={birthday.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{birthday.name}</p>
                      <p className="text-sm text-gray-600">
                        {birthday.isToday ? "¡Hoy es su cumpleaños!" : `En ${birthday.daysUntil} días`}
                      </p>
                    </div>
                    <Badge variant={birthday.isToday ? "default" : "secondary"}>
                      {formatBirthdayDate(birthday.birthday)}
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
                    <p className="text-sm font-medium">{formatBirthdayDate(member.birthday)}</p>
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