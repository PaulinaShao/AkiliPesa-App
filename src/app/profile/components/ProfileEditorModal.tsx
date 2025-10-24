
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';

export function ProfileEditorModal({ isOpen, onClose, profile, onSave }: { isOpen: boolean; onClose: () => void; profile: any; onSave: (updates: any) => void; }) {
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");

  const handleSave = () => {
    onSave({ displayName, bio });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-lg border border-primary/30" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-input" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bio</label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="bg-input" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
