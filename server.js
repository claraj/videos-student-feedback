const app = require('./app')

// Start server running 
const port = process.env.PORT || 3000

const server = app.listen(port, function() {
    console.log('Express server running on port', port)
})









