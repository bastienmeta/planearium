
$( document ).ready(function() {

    function main() {
        const canvas = document.querySelector('#c');
        const renderer = new THREE.WebGLRenderer({canvas});

        const fov = 55;
        const aspect = 2;  // the canvas default
        const near = 0.1;
        const far = 10000;
        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.set(0, 0, 3);

        class MinMaxGUIHelper {
            constructor(obj, minProp, maxProp, minDif) {
                this.obj = obj;
                this.minProp = minProp;
                this.maxProp = maxProp;
                this.minDif = minDif;
            }
            get min() {
                return this.obj[this.minProp];
            }
            set min(v) {
                this.obj[this.minProp] = v;
                this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
            }
            get max() {
                return this.obj[this.maxProp];
            }
            set max(v) {
                this.obj[this.maxProp] = v;
                this.min = this.min;  // this will call the min setter
            }
        }

        function updateCamera() {
            camera.updateProjectionMatrix();
        }

        // const gui = new dat.GUI();
        // gui.add(camera, 'fov', 1, 180).onChange(updateCamera);
        // const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
        // gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
        // gui.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far').onChange(updateCamera);

        const controls = new THREE.OrbitControls(camera, canvas);
        controls.target.set(0, 0, 0);
        controls.update();

        const scene = new THREE.Scene();
        scene.background = new THREE.Color('black');

        const color = 0xFFFFBB;
        const intensity = 1;
        const light = new THREE.PointLight(color, intensity);
        light.position.set(0, 0, 1000);
        scene.add(light);

        const ambient = new THREE.AmbientLight(0xFFFFFF, 0.3)
        scene.add(ambient);

        var axesHelper = new THREE.AxesHelper( 1 );
        scene.add( axesHelper );

        $.ajax({
            url: "/astres.json",
            dataType: "json",
            success: function(response) {
                for(name in response){
                    var o = response[name];
                    var sphereWidthDivisions = 32;
                    var sphereHeightDivisions = 16;
                    var sphereMat;
                    var sphereRadius = 1.3*Math.log(o.info.mean_radius)/149.598000 ;
                    if(name == "Sun"){
                        // sphereRadius = 1.2*Math.log(695510)/149.598000;
                        light.position.set(o.cartesian[0].x, o.cartesian[0].z, o.cartesian[0].y);
                        sphereMat = new THREE.MeshPhongMaterial({color: 0xCCAA88, emissive:0xCCAA88});
                    }
                    else{
                        // if(name == "Earth"){
                        //     sphereRadius = sphereRadius * 1000.0;
                        // }
                        sphereMat = new THREE.MeshPhongMaterial({color: 0x665544});
                    }
                    var sphereGeo = new THREE.SphereBufferGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);

                    var mesh = new THREE.Mesh(sphereGeo, sphereMat);
                    mesh.position.set(o.cartesian[0].x, o.cartesian[0].y, o.cartesian[0].z);
                    mesh.name = name;

                    scene.add(mesh);


                    var ecc = o.keplerian[0].ec;
                    var sma = o.keplerian[0].a;
                    var inc = o.keplerian[0].in * Math.PI / 180.0;

                    var smi = sma*Math.sqrt(1-ecc*ecc)

                    var curve = new THREE.EllipseCurve(
                        0,  0,            // ax, aY
                        sma, smi,         // xRadius, yRadius
                        0,  2 * Math.PI,  // aStartAngle, aEndAngle
                        false,            // aClockwise
                        0                 // aRotation
                    );

                    var points = curve.getPoints( 50 );
                    var geometry = new THREE.BufferGeometry().setFromPoints( points );
                    var material = new THREE.LineBasicMaterial( { color : 0xFFFFFF } );

                    // Create the final object to add to the scene
                    var ellipse = new THREE.Line( geometry, material );
                    ellipse.position.set(sma-smi, 0, 0);

                    var angle = Math.atan2(o.cartesian[0].y, o.cartesian[0].x);
                    console.log(angle);
                    var rotz = new THREE.Matrix4().makeRotationZ( angle );
                    ellipse.applyMatrix( rotz );

                    var rotx = new THREE.Matrix4().makeRotationY(-inc);
                    ellipse.applyMatrix( rotx );


                    scene.add(ellipse);                    
                }
            }
        });

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

        function render() {
            if (resizeRendererToDisplaySize(renderer)) {
                const canvas = renderer.domElement;
                camera.aspect = canvas.clientWidth / canvas.clientHeight;
                camera.updateProjectionMatrix();
            }
            renderer.render(scene, camera);
            requestAnimationFrame(render);
        }

        requestAnimationFrame(render);
    }


    main();

});