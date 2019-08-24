
$( document ).ready(function() {
    var mouse={
    x: 0,
    y: 0
  }, hover_object;

  document.addEventListener('mousemove', onDocumentMouseMove, false);
  function onDocumentMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
function update_mouse() {
  // find intersections

  // create a Ray with origin at the mouse position
  //   and direction into the scene (camera direction)
  var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
  vector.unproject(camera);
  var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

  // create an array containing all objects in the scene with which the ray intersects
  var intersects = ray.intersectObjects(scene.children);

  // hover_object = the object in the scene currently closest to the camera 
  //        and intersected by the Ray projected from the mouse position    

  // if there is one (or more) intersections
  if (intersects.length > 0) {
    // if the closest object intersected is not the currently stored intersection object
    if (intersects[0].object != hover_object && intersects[0].object.name != "line") {
      // restore previous intersection object (if it exists) to its original color
      if (hover_object)
        hover_object.material.color.setHex(hover_object.currentHex);
      // store reference to closest object as current intersection object
      hover_object = intersects[0].object;
      console.log(hover_object);
      // store color of closest object (for later restoration)
      hover_object.currentHex = hover_object.material.color.getHex();
      // set a new color for closest object
      hover_object.material.color.setHex(0xffff00);
      text.element.hidden = false;
      text.setParent(hover_object);
            text.setHTML(hover_object.astre.string());
      text.updatePosition(camera);
    }
    else{
      text.setHTML(hover_object.astre.string());
      text.updatePosition(camera);

    }
  } else // there are no intersections
  {
    // restore previous intersection object (if it exists) to its original color
    if (hover_object){
      hover_object.material.color.setHex(hover_object.currentHex);
      text.element.hidden = true;

    }
    // remove previous intersection object reference
    //     by setting current intersection object to "nothing"
    hover_object = null;
  }
}

  function create_text() {
    var div = document.createElement('div');
    div.className = 'text-label';
    div.style.position = 'absolute';
    div.style.width = 100;
    div.style.height = 100;
    div.innerHTML = "hi there!";
    div.style.top = -1000;
    div.style.left = -1000;
    
    var _this = this;
    
    return {
      element: div,
      parent: false,
      position: new THREE.Vector3(0,0,0),
      setHTML: function(html) {
        this.element.innerHTML = html;
      },
      setParent: function(threejsobj) {
        this.parent = threejsobj;
      },
      updatePosition: function(camera) {
        if(parent) {
          this.position.copy(this.parent.position);
        }
        
        var coords2d = this.get2DCoords(this.position, camera);
        this.element.style.left = coords2d.x + 'px';
        this.element.style.top = coords2d.y + 'px';
      },
      get2DCoords: function(position, camera) {
        var vector = position.project(camera);
        vector.x = (vector.x + 1)/2 * window.innerWidth;
        vector.y = -(vector.y - 1)/2 * window.innerHeight;
        return vector;
      }
    };
  }
    // class MinMaxGUIHelper {
    //     constructor(obj, minProp, maxProp, minDif) {
    //         this.obj = obj;
    //         this.minProp = minProp;
    //         this.maxProp = maxProp;
    //         this.minDif = minDif;
    //     }
    //     get min() {
    //         return this.obj[this.minProp];
    //     }
    //     set min(v) {
    //         this.obj[this.minProp] = v;
    //         this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
    //     }
    //     get max() {
    //         return this.obj[this.maxProp];
    //     }
    //     set max(v) {
    //         this.obj[this.maxProp] = v;
    //         this.min = this.min;  // this will call the min setter
    //     }
    // }

    var distanceScale = 149598000;
    var massScale = 1e21;
    var radiusScale = 1/500.0;
    var velScale = 15;

    var Astres = function(name, eph){
        this.name = name;

        this.mass = eph.info.mass;  
        this.radius = eph.info.mean_radius*radiusScale;
        this.x = eph.cartesian["0"].x;
        this.y = eph.cartesian["0"].y;
        this.z = eph.cartesian["0"].z;
        this.dx = eph.cartesian["0"].vx*velScale; 
        this.dy = eph.cartesian["0"].vy*velScale;
        this.dz = eph.cartesian["0"].vz*velScale;  
        this.quat = {x: 0, y: 0, z: 0, w: 1};
        this.prev_x = this.x;
        this.prev_y = this.y;
        this.prev_z = this.z;

        this.lines = [];
    }

    Astres.prototype = {
        constructor: Astres,

        build_mesh: function(){
            var sphereMat;

            var sphereRadius = 4*Math.log(this.radius)/149.598000 ;
            if(this.name == "Sun"){
                // sphereRadius = 1.2*Math.log(695510)/149.598000;
                sphereMat = new THREE.MeshPhongMaterial({color: 0xCCAA88, emissive:0xCCAA88});
            }
            else{
                // if(name == "Earth"){
                //     sphereRadius = sphereRadius * 1000.0;
                // }
                sphereMat = new THREE.MeshPhongMaterial({color: 0x665544});
            }

            var sphereGeo = new THREE.SphereBufferGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);

            this.mesh = new THREE.Mesh(sphereGeo, sphereMat);
            this.mesh.position.set(this.x, this.y, this.z);
            this.mesh.name = name;
            this.mesh.astre = this;
        },

        // setup_physics: function(){
        //     let transform = new Ammo.btTransform();
        //     transform.setIdentity();
        //     transform.setOrigin( new Ammo.btVector3( this.x, this.y, this.z ) );
        //     transform.setRotation( new Ammo.btQuaternion( this.quat.x, this.quat.y, this.quat.z, this.quat.w ) );
        //     let motionState = new Ammo.btDefaultMotionState( transform );
        //     let colShape = new Ammo.btSphereShape( this.radius );
        //     colShape.setMargin( 0.05 );
        //     let localInertia = new Ammo.btVector3( this.dx, this.dy, this.dz );
        //     colShape.calculateLocalInertia( this.mass, localInertia );
        //     let rbInfo = new Ammo.btRigidBodyConstructionInfo( this.mass, motionState, colShape, localInertia );
        //     let body = new Ammo.btRigidBody( rbInfo );
        //     physicsWorld.addRigidBody( body );
            
        //     this.mesh.userData.physicsBody = body;
        //     rigidBodies.push(this.mesh);            
        // },

        update_pos: function(x, y, z){
            this.x = x;
            this.y = y;
            this.z = z;
        },

        update_vel: function(x, y, z){
            this.dx = x;
            this.dy = y;
            this.dz = z;
        },

        string: function(){
            return  this.name + "\n" + 
                    this.mass + "\n" +
                    this.radius + "\n" +
                    this.x + " " + this.y + " " + this.z + "\n" +
                    this.x + " " + this.y + " " + this.z + "\n";
        },

        compute_gravity: function(){
            var a = {
                x: 0,
                y: 0,
                z: 0
            };

            let G = 6.67408e-11;
            let m1 = this.mass;

            for(b in astresArray){
                let body = astresArray[b];
                if(this==body)
                    continue;

                let m2 = body.mass;                
                let d = Math.sqrt((this.x-body.x)**2 + (this.y-body.y)**2 + (this.z-body.z)**2);
                let tmp = (G * m2) / d**3;

                a.x += tmp * (body.x - this.x);
                a.y += tmp * (body.y - this.y);
                a.z += tmp * (body.z - this.z);
            }
            // console.log(a);
            return a;
        },

        update_trail: function(){
            if(this.lines.length <= 1000){
                var material = new THREE.LineBasicMaterial( { color: 0x0099ff } );

                var geometry = new THREE.Geometry(); 
                geometry.vertices.push(new THREE.Vector3( this.prev_x, this.prev_y, this.prev_z) ); 
                geometry.vertices.push(new THREE.Vector3( this.x, this.y, this.z ) ); 


                var line = new THREE.Line( geometry, material );
                line.name = this.name+"_line_"+this.lines.length;
                scene.add(line);

                this.lines.push(line);
            }
            else{
                var line = this.lines.shift();
                line.geometry.vertices[0].x = this.prev_x;
                line.geometry.vertices[0].y = this.prev_y;
                line.geometry.vertices[0].z = this.prev_z;

                line.geometry.vertices[1].x = this.x;
                line.geometry.vertices[1].y = this.y;
                line.geometry.vertices[1].z = this.z;
               
                line.geometry.verticesNeedUpdate = true;

                this.lines.push(line);
            }

            this.prev_x = this.x;
            this.prev_y = this.y;
            this.prev_z = this.z;            
        },

        draw_ellipse: function(){
            // var ecc = o.keplerian[0].ec;
            // var sma = o.keplerian[0].a;
            // var inc = o.keplerian[0].in * Math.PI / 180.0;

            // var smi = sma*Math.sqrt(1-ecc*ecc)

            // var curve = new THREE.EllipseCurve(
            //     0,  0,            // ax, aY
            //     sma, smi,         // xRadius, yRadius
            //     0,  2 * Math.PI,  // aStartAngle, aEndAngle
            //     false,            // aClockwise
            //     0                 // aRotation
            // );

            // var points = curve.getPoints( 50 );
            // var geometry = new THREE.BufferGeometry().setFromPoints( points );
            // var material = new THREE.LineBasicMaterial( { color : 0xFFFFFF } );

            // // Create the final object to add to the scene
            // var ellipse = new THREE.Line( geometry, material );
            // ellipse.position.set(sma-smi, 0, 0);

            // var angle = Math.atan2(o.cartesian[0].y, o.cartesian[0].x);
            // console.log(angle);
            // var rotz = new THREE.Matrix4().makeRotationZ( angle );
            // ellipse.applyMatrix( rotz );

            // var rotx = new THREE.Matrix4().makeRotationY(-inc);
            // ellipse.applyMatrix( rotx );


            // scene.add(ellipse);
        }          
    }


    var physicsWorld, scene, camera, renderer, canvas, controls, sunlight, clock;
    var tmpTrans;

    var text;

    // var rigidBodies = [];

    var sphereWidthDivisions = 32;
    var sphereHeightDivisions = 16;

    clock = new THREE.Clock();

    function setup_graphics(){

        canvas = document.querySelector('#c');
        renderer = new THREE.WebGLRenderer({canvas});

        const fov = 55;
        const aspect = 2;  // the canvas default
        const near = 0.01;
        const far = 10000;
        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.set(0, 0, 3);
        camera.up.set(0,0,1);


        // function updateCamera() {
        //     camera.updateProjectionMatrix();
        // }

        // const gui = new dat.GUI();
        // gui.add(camera, 'fov', 1, 180).onChange(updateCamera);
        // const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
        // gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
        // gui.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far').onChange(updateCamera);

        controls = new THREE.OrbitControls(camera, canvas);
        controls.target.set(0, 0, 0);
        controls.zoomSpeed = 2;
        controls.update();

        scene = new THREE.Scene();
        scene.background = new THREE.Color('black');

        const color = 0xFFFFBB;
        const intensity = 5;
        sunlight = new THREE.PointLight(color, intensity);
        sunlight.position.set(0,0,10);
        scene.add(sunlight);

        const ambient = new THREE.AmbientLight(0xFFFFFF, 10)
        scene.add(ambient);

        // var axesHelper = new THREE.AxesHelper( 1 );
        // scene.add( axesHelper );
        text = create_text();
        document.querySelector("#container").appendChild(text.element);

    }

    function setup_physics(){

        // let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
        //     dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
        //     overlappingPairCache    = new Ammo.btDbvtBroadphase(),
        //     solver                  = new Ammo.btSequentialImpulseConstraintSolver();

        // physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        // physicsWorld.setGravity(new Ammo.btVector3(0, 0, 0));
    }

    function update_physics( dt, astresArray ){
        for(b in astresArray){
            let body = astresArray[b];
            let acceleration = body.compute_gravity();
            body.dx += acceleration.x * dt;
            body.dy += acceleration.y * dt;
            body.dz += acceleration.z * dt;   

            body.x += body.dx * dt;
            body.y += body.dy * dt;
            body.z += body.dz * dt;

            body.mesh.position.set(body.x, body.y, body.z);

            body.update_trail();
        }
        // Step world
        // physicsWorld.stepSimulation( deltaTime, 10 );
        // // Update rigid bodies
        // for ( let i = 0; i < rigidBodies.length; i++ ) {
        //     let objThree = rigidBodies[ i ];
        //     let objAmmo = objThree.userData.physicsBody;
        //     let ms = objAmmo.getMotionState();
        //     if ( ms ) {
        //         ms.getWorldTransform( tmpTrans );
        //         let p = tmpTrans.getOrigin();
        //         let q = tmpTrans.getRotation();
        //         objThree.position.set( p.x(), p.y(), p.z() );
        //         objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

        //         if(objThree.name == "Earth")
        //             console.log(p.x() + " " + p.y() + " " + p.z());
        //         objThree.astre.update_pos(p.x(), p.y(), p.z());

        //     }
        // }
    }



    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;

    }

    var astresArray = [];

    function render() {
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        // update_mouse();
        update_physics(clock.getDelta(), astresArray);
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    function start(){
        // tmpTrans = new Ammo.btTransform();

        //setup_physics();
        fetch_astres(astresArray);

        setup_graphics();

        requestAnimationFrame(render);
    }

    function fetch_astres(astresArray){
        $.ajax({
            url: "/astres.json",
            dataType: "json",
            success: function(response) {
                for(name in response){
                    var o = response[name];

                    if(name == "Sun")
                        sunlight.position.set(o.cartesian[0].x, o.cartesian[0].z, o.cartesian[0].y);

                    var a = new Astres(name, o);
                    a.build_mesh();
                    // a.setup_physics();
                    astresArray.push(a);
                    scene.add(a.mesh);
                }
            }
        });
    }

    start();
});