const request = require('supertest')
const app = require('../app')
const Feedback = require('../models').Feedback

// Replacing LLM function with mock function with a pre-set return value
// avoid calling the real code - slow, expensive
// not what we are trying to test
// future - we'd write separate tests for LLM feature 
jest.mock('../services/message_sorter', () => {
    return jest.fn().mockResolvedValue(['Mock Department'])
})

describe('Home page request', () => {

    it('should return the home page with the developer name', async () => {
        // AAA
        // Arrange the test scenario
        // Action 
        // Assert - did the action work correctly? 

        // Arrange - 

        // Action - make a request to the home page 
        const response = await request(app).get('/')

        // Assert - did things work as expected? 
        expect(response.statusCode).toBe(200)  // status code for ok
        expect(response.text).toContain('Clara') // use your name 
    })

    it('displays a message about Azure', async () => {
        const response = await request(app).get('/')
        expect(response.text).toContain('Azure')
    })

})

// Test suites - related test for the same feature
describe('Post feedback form', () => {

    beforeEach( async () => {   // delete everything in the database 
        await Feedback.destroy({ truncate: true}) 
    })

    it('should store posted feedback in the database', async () => {

        // Arrange - example feedback info 
        const exampleFeedback = {name: 'test name', email: 'test@test.com', comments: 'test comments', isCurrentStudent: 'no'}
        const urlEncodedData = new URLSearchParams(exampleFeedback).toString() 

        // Action - send post request, including form data 
        const response = await request(app).post('/submit-feedback').send(urlEncodedData)

        // Assert 
        //  - check user sees thank you message 

        expect(response.statusCode).toBe(200)
        expect(response.text).toContain('Thank you for your feedback. We\'ve saved your data to the database.')
        //  - check there is one new feedback in the database

        const feedbacksInDatabase = await Feedback.count()
        expect(feedbacksInDatabase).toBe(1)

        //  - check the name, email, comments, isCurrentStudent are saved in the correct columns 

        const firstFeedback = await Feedback.findOne() 
        expect(firstFeedback.name).toBe('test name')

        expect(firstFeedback).toMatchObject(exampleFeedback)

        //  What about departments? LLM feature 
        expect(firstFeedback.departments).toEqual(['Mock Department'])

    })

        // Unhappy paths - weird data, errors handling 
    it('should reject feedback with no comments', async () => {
        // arrange 
        const exampleFeedback = {name: 'test name', email: 'test@test.com', comments: '', isCurrentStudent: 'no'}
        const urlEncodedData = new URLSearchParams(exampleFeedback).toString() 

        // action - send request with empty string comments 
        const response = await request(app).post('/submit-feedback').send(urlEncodedData)

        // assert - nothing in database, error message shown to user 
        const feedbacksInDatabase = await Feedback.count()
        expect(feedbacksInDatabase).toBe(0)   // nothing saved 

        expect(response.text).toContain('Error saving feedback, please try again later.')

    })

})


describe('Admin page', () => {

    beforeEach( async () => {   // delete everything in the database 
        await Feedback.destroy({ truncate: true}) 
    })

    it('should display all feedback', async () => {

        // Arrange - create and example student feedback
        const exampleA = {name: 'A student', email: 'a@a.com', comments: 'Where is advising', isCurrentStudent: 'yes'}
        const exampleB = {name: 'B student', email: 'b@B.com', comments: 'Open later at night', isCurrentStudent: 'no'}
        Feedback.create(exampleA)
        Feedback.create(exampleB)

        // Action - request the admin page 
        const response = await request(app).get('/admin')

        expect(response.text).toContain(exampleA.name)

        Object.values(exampleA).forEach( value => {
            expect(response.text).toContain(value)
        })

        Object.values(exampleB).forEach( value => {
            expect(response.text).toContain(value)
        })

    })

    // TODO - can you create a test for the admin page before any feedback has been saved?
    // expect that the page shows the "No feedback in database" message

    it('should display no feedback message when there is no feedback in the db', async () => {

        const response = await request(app).get('/admin')
        expect(response.text).toContain('No feedback in database')

    })
})