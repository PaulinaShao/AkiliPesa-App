import AgoraRTC from "agora-rtc-sdk-ng";

export function createAgoraClient() {
  // Specify host role for live streaming
  return AgoraRTC.createClient({ mode: "live", codec: "vp8" });
}
