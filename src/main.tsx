import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "./contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Groups from "./pages/Groups";
import MyGroups from "./pages/MyGroups";
import GroupDetail from "./pages/GroupDetail";
import GroupCalendar from "./pages/GroupCalendar";
import Profile from "./pages/Profile";
import JoinGroup from "./pages/JoinGroup";
import JoinWithoutCode from "./pages/JoinWithoutCode";
import CreateGroup from "./pages/CreateGroup";
import NotFound from "./pages/NotFound";
import './index.css'

/**
 * PROMPT FOR NEW LOVABLE CLOUD PROJECT
 * 
 * Reference implementation: https://github.com/lucamagnasco/whats-up-birthdays-buddy
 * You can fetch/crawl this repo to understand the existing implementation.
 * 
 * Create a full-stack WhatsApp Birthday Reminder application with these features:
 * 
 * ## Core Functionality
 * - Users create groups and invite members via WhatsApp
 * - Members join groups without accounts (anonymous participation)
 * - Automatic birthday reminders sent via WhatsApp (Kapso API)
 * - Calendar view showing all birthdays
 * - Multi-language support (Spanish/English)
 * 
 * ## Database Schema (Lovable Cloud)
 * 
 * **profiles** - Extended user info
 * - user_id (uuid, references auth.users)
 * - full_name (text)
 * - phone_number (text)
 * - birthday (date)
 * - created_at, updated_at (timestamps)
 * 
 * **groups** - Birthday groups
 * - id (uuid, primary key)
 * - name (text)
 * - created_by (uuid, references auth.users)
 * - invite_code (text, unique, 6 characters)
 * - created_at, updated_at (timestamps)
 * 
 * **group_members** - Members in groups
 * - id (uuid, primary key)
 * - group_id (uuid, references groups)
 * - user_id (uuid, nullable, references auth.users)
 * - name (text)
 * - birthday (date)
 * - phone_number (text)
 * - likes (text, nullable)
 * - gift_wishes (text, nullable)
 * - is_anonymous (boolean, default true)
 * - created_at, updated_at (timestamps)
 * 
 * **birthday_messages** - WhatsApp message queue
 * - id (uuid, primary key)
 * - group_id (uuid, references groups)
 * - member_id (uuid, references group_members)
 * - recipient_phone (text)
 * - message_type (text: 'birthday_reminder')
 * - status (text: 'pending', 'processing', 'sent', 'failed')
 * - template_id (text)
 * - template_params (jsonb)
 * - sent_at (timestamp, nullable)
 * - error_message (text, nullable)
 * - created_at, updated_at (timestamps)
 * 
 * ## RLS Policies (Secure by default)
 * - profiles: Users can only view/edit their own profile
 * - groups: Users can view groups they're members of, only creators can delete
 * - group_members: Members visible to all group members
 * - birthday_messages: Only system can write, users can read their own
 * 
 * ## WhatsApp Integration (Kapso API)
 * Edge function: send-whatsapp-message
 * - API: https://api.kapso.io/v1/messages/send
 * - Auth: Bearer {KAPSO_API_KEY} (add as secret)
 * - Template: "birthday-reminder" with params: celebrant_name, group_name, birthday_person_likes
 * 
 * ## Automated Birthday System (Cron Jobs)
 * 
 * 1. Daily Birthday Check (9 AM Buenos Aires time)
 * Function: check_todays_birthdays()
 * - Detect birthdays today
 * - Create pending birthday_messages for group members
 * - Notify all other members in group
 * 
 * 2. Message Processor (every 2 minutes)
 * Function: process_pending_birthday_messages()
 * - Process pending messages
 * - Call send-whatsapp-message edge function
 * - Update status to 'sent' or 'failed'
 * 
 * ## Pages & Features
 * 
 * **Landing (/)** - Hero, How it works, Language toggle, Join dialog
 * **My Groups (/groups)** - List groups, create new, upcoming birthdays
 * **Group Detail (/groups/:id)** - Member list, highlight today's birthdays, add/edit members
 * **Calendar (/groups/:id/calendar)** - Monthly view, navigate months, visual indicators
 * **Profile (/profile)** - Edit user info, phone, birthday, language
 * 
 * ## Design Requirements
 * - Modern, celebratory theme (gradients, animations)
 * - Responsive mobile-first
 * - Semantic color tokens (primary, secondary, accent)
 * - Toast notifications
 * - Loading states
 * 
 * ## Business Logic
 * - Validate international phone numbers
 * - Prevent duplicate members (by phone)
 * - Generate unique 6-character invite codes
 * - Calculate birthday is today (timezone aware)
 * - Send WhatsApp confirmation on join
 * 
 * ## Setup Steps
 * 1. Enable email authentication
 * 2. Add KAPSO_API_KEY secret
 * 3. Set up cron jobs
 * 4. Configure RLS policies
 * 5. Test with manual birthday trigger
 * 
 * Start with database schema and RLS, then build progressively!
 */

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/email" element={<Navigate to="/auth" replace />} />
          <Route path="/groups" element={<MyGroups />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/groups/:id/calendar" element={<GroupCalendar />} />
          <Route path="/create" element={<CreateGroup />} />
          <Route path="/create-group" element={<CreateGroup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/join" element={<JoinGroup />} />
          <Route path="/join-group" element={<JoinWithoutCode />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </LanguageProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />)
