// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

// describe('Server!', () => {
//   // Sample test case given to test / endpoint.
//   it('Returns the default welcome message', done => {
//     chai
//       .request(server)
//       .get('/welcome')
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         expect(res.body.status).to.equals('success');
//         assert.strictEqual(res.body.message, 'Welcome!');
//         done();
//       });
//   });
// });

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

// ********************************************************************************
describe('Testing Add User API', () => {
  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'JohnDoe5', password: 'password1234'})
      .end((err, res) => {
        
        res.should.have.status(200); // Expecting a redirect status code
        
        res.should.redirectTo(/^.*127\.0\.0\.1.*\/login$/);
        done();
      });
  });

  it('Negative : /register. Checking empty username', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: '', password: 'password1234'})
      .end((err, res) => {
        //console.log(res.text);
        expect(res).to.have.status(400);
        expect(res.text).to.include('<title>Register</title>'); //ensure we are rendering register page
        //res.should.redirectTo(/^.*127\.0\.0\.1.*\/register$/);
       
        done();
      });
  });
});

//PART C:

describe('Testing Login Page Renders Correctly', () => {
  it('Renders login page', done => {
    chai
      .request(server)
      .get('/login')
      .end((err, res) => {
        
        //console.log(res.status);
        res.should.have.status(200); // Expecting a render status code
        expect(res.text).to.include('<title>Login</title>'); //This piece of text will only arise in the login pages hbs
        
        done();
      });
  });
});

describe('Testing login', () => {
  it('Positive: /login. Valid user credentials', done => {
    chai
        .request(server)
        .post('/login')
        .send({ username: 'abc', password: '1234' }) //this user is insetred by default within index.js
        .end((err, res) => {
            expect(res).to.have.status(200); // Expect a redirect status
            expect(res).to.redirectTo(/^.*127\.0\.0\.1.*\/discover$/); // Expect redirection to /discover
            done();
        });
  });
  it('Negative: /login. User not found', done => {
    chai
        .request(server)
        .post('/login')
        .send({ username: 'nonexistentuser', password: 'password123' })
        .end((err, res) => {
          console.log(res.text);
            expect(res).to.have.status(200); // Expect a successful render of login again
            expect(res.text).to.include('User not found! Please check spelling or click below to register.'); // Expect error message in the login.hbs file
            done();
        });
  });

});
