import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import UserMenu from "@/components/UserMenu";

interface Group {
  id: string;
  name: string;
}

interface GroupMember {
  id: string;
  name: string;
  birthday: string;
}

interface CalendarBirthday {
  member: GroupMember;
  date: Date;
  isToday: boolean;
}

const GroupCalendar = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarBirthdays, setCalendarBirthdays] = useState<CalendarBirthday[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadGroupData(id);
    }
  }, [id]);

  useEffect(() => {
    if (members.length > 0) {
      generateCalendarBirthdays();
    }
  }, [members, currentDate]);

  const loadGroupData = async (groupId: string) => {
    try {
      setLoading(true);

      // Load group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("id, name")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("id, name, birthday")
        .eq("group_id", groupId);

      if (membersError) throw membersError;
      setMembers(membersData || []);

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

  const generateCalendarBirthdays = () => {
    const today = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const birthdays: CalendarBirthday[] = members.map(member => {
      const memberBirthday = new Date(member.birthday);
      
      // Create birthday for the current calendar month/year
      const birthdayThisYear = new Date(currentYear, memberBirthday.getMonth(), memberBirthday.getDate());
      
      const isToday = 
        today.getDate() === birthdayThisYear.getDate() &&
        today.getMonth() === birthdayThisYear.getMonth() &&
        today.getFullYear() === birthdayThisYear.getFullYear();

      return {
        member,
        date: birthdayThisYear,
        isToday
      };
    }).filter(birthday => birthday.date.getMonth() === currentMonth);

    setCalendarBirthdays(birthdays);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getBirthdaysForDay = (day: number) => {
    return calendarBirthdays.filter(birthday => birthday.date.getDate() === day);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayBirthdays = getBirthdaysForDay(day);
      const isToday = 
        today.getDate() === day &&
        today.getMonth() === currentDate.getMonth() &&
        today.getFullYear() === currentDate.getFullYear();
      
      days.push(
        <div
          key={day}
          className={`p-2 min-h-[60px] border border-gray-200 ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${
            isToday ? 'text-blue-700' : 'text-gray-700'
          }`}>
            {day}
          </div>
          {dayBirthdays.map((birthday) => (
            <div
              key={birthday.member.id}
              className={`text-xs p-1 rounded mb-1 ${
                birthday.isToday 
                  ? 'bg-yellow-200 text-yellow-800' 
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              🎂 {birthday.member.name}
            </div>
          ))}
        </div>
      );
    }
    
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Cargando calendario...</p>
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
            onClick={() => navigate(`/groups/${id}`)}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al grupo
          </Button>
          <UserMenu />
        </div>

        {/* Calendar Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  Calendario - {group?.name}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Cumpleaños del grupo por mes
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={previousMonth}
            size="sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h2 className="text-xl font-semibold capitalize">
            {formatMonthYear(currentDate)}
          </h2>
          
          <Button
            variant="outline"
            onClick={nextMonth}
            size="sm"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-0">
            {/* Week day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="p-3 text-center font-medium text-gray-600 bg-gray-50">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {renderCalendarGrid()}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
            <span>Cumpleaños</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-200 border border-yellow-300 rounded"></div>
            <span>¡Hoy!</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded"></div>
            <span>Día actual</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupCalendar; 