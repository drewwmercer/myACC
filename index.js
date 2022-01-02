const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  mongoose = require('mongoose'),
  Models = require('./models.js');

mongoose.connect('mongodb://localhost:27017/myGarage',{useNewUrlParser: true, useUnifiedTopology: true})

const app = express();
const wheel = String.fromCodePoint(0x1F697);
const smoke = String.fromCodePoint(0x1F4A8);

const Vehicles = Models.Vehicle;
const Owners = Models.Owner;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const {check, validationResult} = require ('express-validator');

const cors = require('cors');
app.use(cors()); 

let auth = require('./auth.js')(app);
const passport = require('passport');
require('./passport.js');

app.use(morgan('common'));
app.use(express.static('public'));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride());

let topVehicles = [
  {
    nickname: '2020 Gladiator Rubicon - Firecracker Red',
    make: 'Jeep',
    year: '2020',
    model: 'Gladiator',
    trim: 'Rubicon',
    latestmilecount: 22222,
    latestmiledate: '01012022'
  },
  {
    nickname: '2009 Ninja 250R',
    make: 'Kawasaki'
  },
  {
    nickname: '2019 Slingshot SLR',
    make: 'Polaris'
  }
];

let starterOwners = [
    {
      ownername: 'firstDriver',
      password: 'test1pass',
      vehicles: {}
    },
    {
        ownername: 'secondDriver',
        password: 'test1pass'
    },
    {
        ownername: 'thirdDriver',
        password: 'test1pass'
    }
  ];

// GET requests
app.get('/', (req, res) => {
  res.send('Welcome to myGarage!');
});

app.get('/documentation', (err, req, res, next) => {                  
  res.sendFile('public/documentation.html', { root: __dirname });

  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// app.get('/vehicles', (req, res) => {
//   Vehicles.find().then((vehicles)) => {
//     res.status(201).json(movies);
// });

app.get('/vehicles', passport.authenticate('jwt',{session: false}),
(req,res)=>{
    Vehicles.find()
    .then((vehicles) => {
        res.status(201).json(vehicles);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: '+ err);
    });
});

// Gets a list of all owners
app.get('/owners', (req, res) => {
    res.json(starterOwners);
  });

// Gets the data about a single owner, by ownername
app.get('/owners/:name', (req, res) => {
    res.json(starterOwners.find((owner) =>
      { return owner.ownername === req.params.name }));
  });

  // Gets the data about a single make, by brandname
app.get('/vehicles/:name', (req, res) => {
    res.json(topVehicles.find((brand) =>
      { return vehicle.brandname === req.params.name }));
  });

// POST requests
// Add a new owner
app.post('/owners',[
    check('Ownername', 'Ownername is required').isLength({min:4}),
    check('Ownername', 'Ownername cannot contain non alphanumeric characters.').isAlphanumeric(),
    check('Password', 'Password is required.').not().isEmpty(),
    check('Email', 'Email does not appear to be valid.').isEmail()
],
(req,res) =>{
    let errors = validationResult(req);
      if(!errors.isEmpty()){return res.status(422).json({errors: errors.array()
   })
       }
    let hashedPassword = Owners.hashPassword(req.body.Password);
    Owners.findOne({Ownername: req.body.Ownername}).then(
        (owner) =>{
            if(owner){
                return res.status(400).send(req.body.Ownername + ' already exists');
            } else {Owners.create({
                Ownername: req.body.Ownername,
                Password: hashedPassword, 
                Email: req.body.Email,
                DOB: req.body.DOB
            })
            .then ((owner) => {res.status(201).json(owner)}
            ).catch((error) => {console.error(error);
              res.status(500).send ('Error: ' + error);
          }) 
        }
      })
      .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
      })
  })

// DELETE requests

// listen for requests
app.listen(8080, () => {
  console.log(`The ${wheel}${smoke} myGarage app is listening on port 8080.`);
});
