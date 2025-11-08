import { useState, useEffect } from 'react';
import { LogOut, Plus, CheckSquare, CheckCircle, PlusCircle, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Profile {
  full_name: string;
  email: string;
}

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  created_at: string;
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState({ active: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchActivities();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const fetchActivities = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setActivities(data);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    const { data: activeData } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('activity_type', 'task_added');

    const { data: completedData } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('activity_type', 'task_completed');

    setStats({
      active: (activeData as any) || 0,
      completed: (completedData as any) || 0,
    });
  };

  const createActivity = async (type: string, title: string) => {
    if (!user) return;

    await supabase.from('activities').insert({
      user_id: user.id,
      activity_type: type,
      title: title,
    });

    fetchActivities();
    fetchStats();
  };

  const handleLogout = async () => {
    await signOut();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_added':
        return <PlusCircle className="w-5 h-5 text-green-600" />;
      case 'task_completed':
        return <Check className="w-5 h-5 text-blue-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-blue-600 transition"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900">
            Hi, {profile?.full_name || 'there'}!
          </h2>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your account today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-500 text-white rounded-xl p-6 text-center shadow-lg">
            <CheckSquare className="w-10 h-10 mx-auto mb-3" />
            <p className="text-3xl font-bold">{stats.active}</p>
            <p className="text-sm opacity-90">Active Tasks</p>
          </div>
          <div className="bg-green-500 text-white rounded-xl p-6 text-center shadow-lg">
            <CheckCircle className="w-10 h-10 mx-auto mb-3" />
            <p className="text-3xl font-bold">{stats.completed}</p>
            <p className="text-sm opacity-90">Completed</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Activity</h3>
          <div className="bg-white rounded-xl shadow-sm border divide-y">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No activities yet. Click the + button to get started!
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="p-4 flex items-center space-x-3 hover:bg-gray-50 transition">
                  {getActivityIcon(activity.activity_type)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{getTimeAgo(activity.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <button
        onClick={() => createActivity('task_added', 'New task created')}
        className="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
