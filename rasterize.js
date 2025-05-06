function main(){

    var canvas = document.getElementById("myWebGLCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener('mousemove', mouseMoveEvent);

    var mxVal = 0;
    var myVal = 0;
    function mouseMoveEvent(e) {
        var rect = canvas.getBoundingClientRect();
        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;
        mxVal = mouseX / canvas.width;
        myVal = mouseY / canvas.height;
        console.log("x : " + mxVal + " y : " + myVal);
    };

    gl = canvas.getContext("webgl");
    gl.clearColor(0,0,0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    
    var vShaderCode = `
    precision mediump float;

    uniform vec2 mousePos;
    uniform float elapsed; //between 0 and 1

    attribute vec3 vertexPosition; //tiny triangle around the center of the screen
    attribute float triangleNumber; //used to place the triangle correctly

    varying vec3 fragmentColor;
    varying vec2 fragmentPosition;
    varying float fragmentTime;

    varying float is_white_bool;    
    
    void main(void) {
        const float PI = 3.1415926535897932384626433832795;

        float temp = vertexPosition.x - 1.0 + 2.0 * triangleNumber / 100.0;
        float tempy = elapsed;

        fragmentTime = elapsed;

        float x = vertexPosition.x;
        float y = vertexPosition.y;
        //scale first
        fragmentColor = vec3(0.0,0.0,0.0);  
        bool isWhite = false;
        is_white_bool = 0.0;  
        if(mod(triangleNumber, 2.0) == 1.0){

            //white triangle
            isWhite = false;
            y*=1.2;
            x*=1.2;
            fragmentColor = vec3(0.0,0.25,0.25);
            is_white_bool = 1.0; //true
            //fragmentColor = vec3(1.0,0.41,0.706);
        }
        int columnCount = 50;
        int rowCount = 10;
        float yStep = 2.0/float(rowCount+1);
        int trueN = int(triangleNumber/2.0);
        int row = trueN/50;
        int column = trueN-row*50;
        float angle = 0.0;
        float magnitude = sqrt(y*y + x*x);
        if(x == 0.0){
            if(y > 0.0){
                angle = PI/2.0;
            }else{
                angle = -PI/2.0;
            }
        }else{
            angle = atan(y, x);
        }
        angle +=  (elapsed*PI*2.0*(mod(float(row*column),3.0)+1.0) + float(row) + float(column));
        float originx = magnitude * cos(angle);
        float originy = magnitude  *sin(angle);
        x = 0.0;
        y = 0.0;
        x -= 1.0;
        y -= 1.0 - yStep;
        x += float(column)/50.0*2.0 + elapsed*2.0 +float(row)/3.0;
        x = mod(x, 2.0) -1.0;
        y += 0.182*float(row) + sin(float(column) + elapsed*PI*2.0)/3.0;
        // float yDiff = (1.0-mousePos.y*2.0) - y;
        // float xDiff = (mousePos.x*2.0 - 1.0) - x;
        // float dist = sqrt(yDiff*yDiff + xDiff * xDiff);
        
        x += originx;
        y += originy;
        fragmentPosition = vec2(x, y); //used in coloration

        if(isWhite){
            gl_Position = vec4(x, y, 0, 1.0);
        }else{
            gl_Position = vec4(x, y, 0.1, 1.0);
        }
        
    }
    `;
    var fShaderCode = `
    precision mediump float;

    uniform vec2 mousePos;    

    varying vec3 fragmentColor;
    varying vec2 fragmentPosition;
    varying float is_white_bool;

    varying float fragmentTime;

    void main(void) {
        if(is_white_bool > 0.5){
            //is white true
            vec3 newColor = vec3(0.0, 0.0, 0.0);
            //distance is between 0 and sqrt(2)
            float d1 = fragmentPosition.x - mousePos.x*2.0+1.0;
            float d2 = fragmentPosition.y - (-mousePos.y*2.0)-1.0;
            float distance = sqrt(d1*d1 + d2*d2);
            float col = mod(distance*10.0-fragmentTime*150.0, 10.0);

            gl_FragColor = vec4(col/20.0, col/20.0, col/20.0, 1.0);
        }else{
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);            
        }
    }
    `;
    
    
    var fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader,fShaderCode);
    gl.compileShader(fShader);
    
    var vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader,vShaderCode);
    gl.compileShader(vShader);
    
    
    if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
        throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
        gl.deleteShader(fShader);
    } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
        throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
        gl.deleteShader(vShader);
    }
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, fShader);
    gl.attachShader(shaderProgram, vShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
    } 
    
    gl.useProgram(shaderProgram);
    
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);


    var vertexArray = [];
    var indexArray = [];
    for(var i = 0; i < 3000; i++){
        var triNum = Math.floor(i/3);
        if(i%3 == 0){
            vertexArray.push(0.05,-0.07,0,triNum);
        }
        if(i%3 == 1){
            vertexArray.push(-0.05,-0.07,0,triNum);            
        }
        if(i%3 == 2){
            vertexArray.push(0,0.07,0,triNum);
            indexArray.push(i-2, i-1, i);
        }
    }
    console.log(vertexArray)
    console.log(indexArray)
    console.log(new Float32Array(vertexArray))

    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertexArray),gl.STATIC_DRAW);
    
    triangleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer); //change here
    
    
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indexArray),gl.STATIC_DRAW); //change here
    
    var vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition"); 
    gl.enableVertexAttribArray(vertexPositionAttrib);
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false, 4 * Float32Array.BYTES_PER_ELEMENT ,0); 

    var vertexTrianglenAttrib = gl.getAttribLocation(shaderProgram, "triangleNumber"); 
    gl.enableVertexAttribArray(vertexTrianglenAttrib);
    gl.vertexAttribPointer(vertexTrianglenAttrib,1,gl.FLOAT,false, 4 * Float32Array.BYTES_PER_ELEMENT ,3*Float32Array.BYTES_PER_ELEMENT); 
    
    var elapsedUniformLocation = gl.getUniformLocation(shaderProgram, 'elapsed');
    var mouseUniformLocation = gl.getUniformLocation(shaderProgram, 'mousePos');
    
    var LOOP_CONSTANT = 5;
    function repeatRender(){
        function step(timestamp) {
            var seconds = timestamp/1000;
            var elapsed = (seconds%LOOP_CONSTANT)/LOOP_CONSTANT;
            gl.uniform1f(elapsedUniformLocation, new Float32Array([elapsed]));
            gl.uniform2fv(mouseUniformLocation, new Float32Array([mxVal, myVal]));

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.drawElements(gl.TRIANGLES, indexArray.length, gl.UNSIGNED_SHORT, 0);
            
            window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
    }
    repeatRender();
}