router.get('/test-events', async (req, res) => {
  try {
    console.log('🧪 Simple test route working');
    
    res.json({
      success: true,
      message: 'Route is working!',
      debug: {
        hasApiKey: !!process.env.ANTHROPIC_API_KEY,
        model: process.env.CLAUDE_MODEL
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});