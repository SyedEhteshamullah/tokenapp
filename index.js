var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var passport = require('passport');
var config = require('./config/main');
var User = require('./app/models/user');
var jwt = require('jsonwebtoken');
var cors = require('cors')

var port = 3000;
var corsOptions = {
    origin: 'http://localhost:4200',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }

// User cors to enable cross origin resource access
app.use(cors(corsOptions));

// Use bodyparser to parse the body on port requests
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// Use morgan for logging the requests
app.use(morgan('dev'));

// Initialize passport
app.use(passport.initialize());

// Connect to the mongodb server
mongoose.connect(config.database);

// Bring in the passport strategy that we created
require('./config/passport')(passport);

var apiRoutes = express.Router();

apiRoutes.post('/register',function(req,res){
    console.log(req.body);
    //console.log(req.body.email,req.body.password,req.body.regKey);
    if(!req.body.email || !req.body.password){
        res.json({success:false, message:"Please endter a valid Email, Password and Registration key to Register."});
    }
    else{
        var newUser = new User({
            email:req.body.email,
            password:req.body.password
        });
        newUser.save(function(err){
            if(err){
                return res.json({success: false, message: "Email already exists"});
            }
            res.json({success: true, message: "User successfully registered!"});
        });
    }
});

apiRoutes.post('/login',function(req,res){
    User.findOne({
        email:req.body.email
    },function(err,user){
        if(err){
            console.log('An error occurred : ',err);
        } 
            
        else if(!user){
            res.json({success:false,message:"Authentication Failed No such user found."});
        }
        else{
            user.comparePassword(req.body.password,function(err,isMatch){
                if(isMatch && !err){
                    var token = jwt.sign(user.toObject(),config.secret,{
                        expiresIn:20
                    });
                    res.json({success:true,Authorization:'JWT '+token });
                }
                else{
                    res.json({success:false,message:"Authentication Failed. Password Mismatch"});
                }
            });
        }
    });
});

apiRoutes.get('/home',passport.authenticate('jwt',{session: false}),function(req,res){
    res.send(req.user._id);
});

app.use(apiRoutes);

app.get('/',(req,res)=>{
    res.send('Home page');
});

app.listen(port,console.log('Server running on port : ',port));
