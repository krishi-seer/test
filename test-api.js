async function testSignupAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/voice-signup-with-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        mobile: '1234567890',
        location: 'Test Location',
        crops: 'Test Crops',
        faceDescriptor: Array.from({length: 128}, () => Math.random()),
        photo: 'data:image/jpeg;base64,test'
      })
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testSignupAPI();