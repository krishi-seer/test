import VoiceSignupForm from '@/components/VoiceSignupForm';

export const metadata = {
  title: 'Voice Signup - Krishi Seer',
  description: 'Zero-type signup using voice for farmers',
};

export default function VoiceSignupPage() {
  return (
    <main>
      <VoiceSignupForm />
    </main>
  );
}
