import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  src?: string
  username?: string
  className?: string
}

export function UserAvatar({ src, username, className }: UserAvatarProps) {
  return (
    <Avatar className={cn("h-10 w-10", className)}>
      <AvatarImage src={src} alt={`@${username}`} />
      <AvatarFallback>{username ? username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
    </Avatar>
  )
}
