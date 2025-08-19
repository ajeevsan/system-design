const express = require('express')

const app = express()

const PORT = 3000

app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello from express server.')
})

app.get('/users', (req, res) => {
    const users = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}]
    res.json(users)
})

app.post('/users', (req, res) => {
    const newUser = req.body
    console.log('User received: ', newUser)
    res.status(201).json({ message: 'User Created', data: newUser})
})

app.listen(PORT, () => {
    console.log(`Listning to port ${PORT}`)
})