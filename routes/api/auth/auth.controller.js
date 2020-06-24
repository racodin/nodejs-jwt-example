const jwt = require('jsonwebtoken')
const User = require('../../../models/user')

/*
  POST /api/auth/register
  {
    username,
    password
  }
*/
exports.register = (req, res) => {
  const { username, password } = req.body
  let newUser = null

  // create a new user if does not exist
  const create = (user) => {
    if(user) {
      throw new Error('username exists')
    } else {
      return User.create(username, password)
    }
  }

  // count the number of the user
  const count = (user) => {
    newUser = user
    return User.count({}).exec()
  }

  // assign admin if count is 1
  const assign = (count) => {
    if(count === 1) {
      return newUser.assignAdmin()
    } else {
      // if not, return a promise that return false
      return Promise.resolve(false)
    }
  }
  
  // respond to the client
  const respond = (isAdmin) => {
    res.json({
      message: 'registered succeessfully',
      admin: isAdmin ? true : false
    })
  }

  // run when there is an error (username exists)
  const onError = (error) => {
    res.status(409).json({
      message: error.message
    })
  }

  // check username duplication
  User.findOneByUsername(username)
    .then(create)
    .then(count)
    .then(assign)
    .then(respond)
    .catch(onError)

  // res.send('this router is working')
}

/*
  POST /api/auth/login
  {
    username,
    password
  }
*/
exports.login = (req, res) => {
  const { username, password } = req.body
  const secret = req.app.get('jwt-secret')
  
  // check the user info & generate the jwt
  const check = (user) => {
    if(!user) {
      // user does not exist
      throw new Error('login failed')
    } else {
      // user exists, check the password
      if(user.verify(password)){
        // create a promise that generate jwt asynchronously
        const p = new Promise((resolve, reject) => {
          jwt.sign({
            _id: user._id,
            username: user.username,
            admin: user.admin
          }, secret, {
            expiresIn: '7d',
            issuer: 'racodin.com',
            subject: 'userInfo',
          }, (err, token) => {
            if(err) reject(err)
            resolve(token)
          })
        })
        return p
      } else {
        throw new Error('login failed')
      }
    }
  }

  // respond the token
  const respond = (token) => {
    res.json({
      message: 'logged in successfully',
      token
    })
  }

  // error occured
  const onError = (error) => {
    res.status(403).json({
      message: error.message
    })
  }

  // find the user
  User.findOneByUsername(username)
    .then(check)
    .then(respond)
    .catch(onError)

  // res.send('login api is working')
}

/*
  GET /api/auth/check
*/
// exports.checkToken = (req, res) => {
//   // read the token from header or url
//   const token = req.headers['x-access-token'] || req.query.token

//   // token does not exist
//   if(!token) {
//     return res.status(403).json({
//       success: false,
//       message: 'not logged in'
//     })
//   }

//   // create a promise that decodes the token
//   const p = new Promise((resolve, reject) => {
//     jwt.verify(token, req.app.get('jwt-secret'), (err, decoded) => {
//       if(err) reject(err)
//       resolve(decoded)
//     })
//   })

//   // if token is valid, it will respond with its info
//   const respond = (token) => {
//     res.json({
//       success: true,
//       info: token
//     })
//   }

//   // if it has failed to verify, it will return an error message
//   const onError = (error) => {
//     res.status(403).json({
//       success: false,
//       message: error.message
//     })
//   }

//   // process the promise
//   p.then(respond).catch(onError)
// }

exports.check = (req, res) => {
  res.json({
    success: true,
    info: req.decoded
  })
}