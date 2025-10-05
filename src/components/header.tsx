'use client';

import { Search, Mail, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { users } from '@/lib/data';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent } from 'react';

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultQuery = searchParams.get('q') || '';

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    } else {
      router.push('/search');
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="md:hidden flex-1" /> {/* Spacer for mobile */}
      <div className="flex-1 hidden md:block">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              name="search"
              type="search"
              placeholder="Search accounts and videos"
              className="pl-10 w-full max-w-sm"
              defaultValue={defaultQuery}
            />
          </div>
        </form>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="h-6 w-6" />
          <span className="sr-only">Search</span>
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="h-6 w-6" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="ghost" size="icon">
          <Mail className="h-6 w-6" />
          <span className="sr-only">Messages</span>
        </Button>
        <UserAvatar src={users[0].avatar} username={users[0].username} className="h-9 w-9" />
      </div>
    </header>
  );
}
