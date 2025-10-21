
"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { uploadFile } from "@/firebase/storageHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { X, Save, Mic, Upload } from "lucide-react";

export const CloneAgentModal = ({ isOpen, onClose, type, data, uid }: { isOpen: boolean, onClose: () => void, type: 'clone' | 'agent', data: any, uid: string | undefined}) => {
  const firestore = useFirestore();
  const [form, setForm] = useState({
    name: "",
    description: "",
    tone: "",
    emotionProfile: "",
    avatarUrl: "",
    voiceUrl: "",
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (data) {
        setForm({
            name: data.name || "",
            description: data.description || "",
            tone: data.tone || "neutral",
            emotionProfile: data.emotionProfile || "friendly",
            avatarUrl: data.avatarUrl || "",
            voiceUrl: data.voiceUrl || "",
        });
    }
  }, [data, isOpen]);


  // ---- Handlers ----
  const handleChange = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  // Upload Avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    setUploading(true);
    const url = await uploadFile(`avatars/${uid}/${type}_avatar.jpg`, file);
    if(url) setForm((f) => ({ ...f, avatarUrl: url }));
    setUploading(false);
  };

  // Upload Voice Sample
  const handleVoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    setUploading(true);
    const url = await uploadFile(`voices/${uid}/${type}_voice.wav`, file);
    if(url) setForm((f) => ({ ...f, voiceUrl: url }));
    setUploading(false);
  };

  // Record Audio
  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        const file = new File([blob], `${type}_voice.wav`, { type: "audio/wav" });
        setUploading(true);
        const url = await uploadFile(`voices/${uid}/${type}_voice.wav`, file);
        if(url) setForm((f) => ({ ...f, voiceUrl: url }));
        setUploading(false);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic permission denied:", err);
      alert("Please allow microphone access to record.");
    }
  };

  // Save Updates
  const handleSave = async () => {
    if (!uid || !type || !firestore) return;
    setSaving(true);
    const collectionName = type === "clone" ? "clones" : "agents";
    const docId = `${type}_${uid.slice(0, 5)}`;
    const ref = doc(firestore, "users", uid, collectionName, docId);
    
    try {
        await updateDoc(ref, {
            ...form,
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Failed to save:", error);
    } finally {
        setSaving(false);
        onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-[#0e0e10]/90 border border-[#8B5CF6]/40 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">
                {type === "clone" ? "Edit AI Clone" : "Edit My Agent"}
              </h2>
              <button onClick={onClose}>
                <X className="text-gray-400 hover:text-white" size={20} />
              </button>
            </div>

            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative w-24 h-24 mb-3">
                <Image
                  src={form.avatarUrl || '/assets/default-avatar-tanzanite.svg'}
                  alt="Avatar"
                  fill
                  className="rounded-full object-cover border-2 border-[#8B5CF6]/40"
                />
              </div>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" id="avatarUpload" />
              <label htmlFor="avatarUpload" className="text-xs text-[#8B5CF6] cursor-pointer hover:underline">
                {uploading ? "Uploading..." : "Upload Avatar"}
              </label>
            </div>

            {/* Editable Fields */}
            <div className="space-y-3 text-sm">
               <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="bg-input border-border/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                   className="bg-input border-border/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tone</label>
                <Input
                  value={form.tone}
                  onChange={(e) => handleChange("tone", e.target.value)}
                  placeholder="e.g. friendly, professional"
                   className="bg-input border-border/50"
                />
              </div>
              {type === 'clone' && (
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Emotion Profile</label>
                    <Input
                    value={form.emotionProfile}
                    onChange={(e) => handleChange("emotionProfile", e.target.value)}
                    placeholder="e.g. warm, empathetic"
                     className="bg-input border-border/50"
                    />
                </div>
              )}
            </div>
            
            {/* Voice Section */}
            <div className="mt-6 border-t border-[#8B5CF6]/30 pt-4">
              <label className="block text-sm text-gray-400 mb-2">Voice Sample</label>
              <div className="flex items-center justify-between">
                <Button variant="secondary" onClick={toggleRecording} disabled={uploading}>
                  <Mic className="mr-2 h-4 w-4" />
                  {recording ? "Stop Recording" : "Record Voice"}
                </Button>
                <label htmlFor="voiceUpload" className="cursor-pointer text-[#8B5CF6] hover:underline text-xs">
                  <Upload className="inline mr-1 h-3 w-3" /> Upload File
                </label>
                <input type="file" accept="audio/*" onChange={handleVoiceUpload} id="voiceUpload" className="hidden" />
              </div>
              {form.voiceUrl && (
                <audio controls src={form.voiceUrl} className="w-full mt-3 rounded-lg border-none" />
              )}
            </div>


            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={onClose} disabled={saving || uploading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || uploading}>
                <Save size={16} className="mr-1" /> {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
