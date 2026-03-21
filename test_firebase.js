async function testApiKey() {
  const apiKey = "AIzaSyDY-zEP_8HDewz9QcIo2y7Ck1fDpSBJ54I";
  const url = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${apiKey}`;
  
  console.log("Testing API Key:", apiKey);
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch Error:", err.message);
  }
}

testApiKey();
