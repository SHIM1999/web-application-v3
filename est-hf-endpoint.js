#!/usr/bin/env node

// Test script to verify Hugging Face Gradio API endpoint
// Usage: node test-hf-endpoint.js

const axios = require('axios');

const HF_BASE_URL = 'https://mukhammed19-virtual-try-on-app.hf.space';

// Test with example images from the HF Space
const humanImage = 'https://huggingface.co/spaces/MUKHAMMED19/virtual-try-on-app/resolve/main/example/human/human01.jpg';
const garmentImage = 'https://huggingface.co/spaces/MUKHAMMED19/virtual-try-on-app/resolve/main/example/cloth/cloth02.jpg';

async function testEndpoint() {
  try {
    console.log('Testing Hugging Face Space endpoint...\n');
    
    // Step 1: Initiate prediction
    console.log('Step 1: Initiating prediction...');
    const initResponse = await axios.post(
      `${HF_BASE_URL}/call/virtual_tryon`,
      { data: [humanImage, garmentImage] },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );
    
    const eventId = initResponse.data.event_id;
    console.log(`✅ Got event ID: ${eventId}\n`);
    
    // Step 2: Poll for result
    console.log('Step 2: Polling for result...');
    const sseUrl = `${HF_BASE_URL}/call/virtual_tryon/${eventId}`;
    
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      attempts++;
      process.stdout.write(`\rAttempt ${attempts}/${maxAttempts}...`);
      
      try {
        const response = await axios.get(sseUrl, {
          responseType: 'text',
          timeout: 10000,
        });
        
        const lines = response.data.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonData = JSON.parse(line.slice(6));
            
            if (jsonData.msg === 'process_completed') {
              console.log('\n\n✅ SUCCESS! Processing completed.');
              console.log('Result:', jsonData.output);
              return;
            }
            
            if (jsonData.msg === 'error') {
              throw new Error(jsonData.error);
            }
            
            if (jsonData.msg === 'progress') {
              process.stdout.write(`\rProcessing: ${jsonData.progress || 'working'}...`);
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
    }
    
    console.log('\n\n❌ Timeout waiting for result');
    
  } catch (error) {
    console.error('\n\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testEndpoint();