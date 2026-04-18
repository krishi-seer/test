import VoiceSignupWithFace from '@/components/VoiceSignupWithFace';

export const metadata = {
  title: 'Voice Signup - Krishi Seer',
  description: 'Zero-type signup using voice and face for farmers',
};

export default function VoiceSignupPage() {
  return (
    <main>
      <VoiceSignupWithFace />
    </main>
  );
}
