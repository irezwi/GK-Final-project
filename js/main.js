// Deklaracja zmiennych wykorzystywanych w kodzie
var gl_canvas;
var gl_ctx;
var _triangleVertexBuffer;
var _triangleFacesBuffer;
var _position;
var _color;
var _uv;
var _sampler;
var _PosMatrix;
var _MovMatrix;
var _ViewMatrix;
var _matrixProjection;
var _matrixMovement;
var _matrixView;
var _cubeTexture;
var rotationSpeed = 0.001;
var zoomRatio = -6;

var X, Y, Z;
var figureType;
var animation;

function runWebGL() {
  getSpeed();
  getFigureType();
  getRotation();
  gl_canvas = document.getElementById("glcanvas");
  gl_ctx = gl_getContext(gl_canvas);
  gl_initShaders();
  gl_initBuffers();
  gl_setMatrix();
  _cubeTexture = gl_initTexture();
  gl_draw();
}

// Funkcja pobierająca informacja jaka bryła ma być animowana
// true - sześcian
// false - czworościan
function getFigureType() {
  figureType = document.getElementById('cube').checked;
}

// Funkcja pobierająca z suwaka informacje o prędkości obrotu bryły
function getSpeed() {
  rotationSpeed = document.getElementById('speed').value / 10000;
  document.getElementById('speed').text = "Speed: " + rotationSpeed;
}

// Funkcja pobierająca z checkboxów informacje
// wokół krótych osi ma obracać się bryła
function getRotation() {
  X = document.getElementById('rotateX').checked;
  Y = document.getElementById('rotateY').checked;
  Z = document.getElementById('rotateZ').checked;
}

// ==================================================================== //

function gl_getContext(canvas) {
  try {
    var ctx = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    ctx.viewportWidth = canvas.width;
    ctx.viewportHeight = canvas.height;
  } catch (e) {}

  if (!ctx) {
    document.write('Unable to initialize WebGL. Your browser may not support it.')
  }
  return ctx;
}

// ==================================================================== //

// Deklaracja shaderów, czyli fragmentów kodu kompilowanych przez WebGL
function gl_initShaders() {
  var vertexShader = "\n\
      attribute vec3 position;\n\
      uniform mat4 PosMatrix;\n\
      uniform mat4 MovMatrix;\n\
      uniform mat4 ViewMatrix; \n\
      attribute vec2 uv;\n\
      varying vec2 vUV;\n\
      void main(void) {\n\
         gl_Position = PosMatrix * ViewMatrix * MovMatrix * vec4(position, 1.);\n\
         vUV = uv;\n\
      }";

  var fragmentShader = "\n\
      precision mediump float;\n\
      uniform sampler2D sampler;\n\
      varying vec2 vUV;\n\
      void main(void) {\n\
         gl_FragColor = texture2D(sampler, vUV);\n\
      }";

  // Funkcja służąca do kompilacji shaderów
  var getShader = function (source, type, typeString) {
    var shader = gl_ctx.createShader(type);
    gl_ctx.shaderSource(shader, source);
    gl_ctx.compileShader(shader);

    if (!gl_ctx.getShaderParameter(shader, gl_ctx.COMPILE_STATUS)) {
      alert('error in' + typeString);
      return false;
    }
    return shader;
  };

  var shader_vertex = getShader(vertexShader, gl_ctx.VERTEX_SHADER, "VERTEX");
  var shader_fragment = getShader(fragmentShader, gl_ctx.FRAGMENT_SHADER, "FRAGMENT");


  // Utworzenie program i załączenie wyżej zdefiniowanych shaderów
  var SHADER_PROGRAM = gl_ctx.createProgram();
  gl_ctx.attachShader(SHADER_PROGRAM, shader_vertex);
  gl_ctx.attachShader(SHADER_PROGRAM, shader_fragment);

  // Linkowanie shaderów do kontekstu WebGL (gl_ctx)
  gl_ctx.linkProgram(SHADER_PROGRAM);

  // Linkowanie zmiennych GLSL do zmiennych js
  _PosMatrix = gl_ctx.getUniformLocation(SHADER_PROGRAM, "PosMatrix");
  _MovMatrix = gl_ctx.getUniformLocation(SHADER_PROGRAM, "MovMatrix");
  _ViewMatrix = gl_ctx.getUniformLocation(SHADER_PROGRAM, "ViewMatrix");
  _sampler = gl_ctx.getUniformLocation(SHADER_PROGRAM, "sampler");
  _uv = gl_ctx.getAttribLocation(SHADER_PROGRAM, "uv");
  _position = gl_ctx.getAttribLocation(SHADER_PROGRAM, "position");
  
  gl_ctx.enableVertexAttribArray(_uv);
  gl_ctx.enableVertexAttribArray(_position);
  
  gl_ctx.useProgram(SHADER_PROGRAM);
  gl_ctx.uniform1i(_sampler, 0);
}

// ==================================================================== //

function gl_initBuffers() {
  if (figureType) {
    var triangleVertices = [
    // x, y, z,     u, v,
    // pierwsza ściana
      -1,-1,-1,     0, 0,
       1,-1,-1,     1, 0,
       1, 1,-1,     1, 1,
      -1, 1,-1,     0, 1,
    // druga ściana
      -1,-1, 1,     0, 0,
       1,-1, 1,     1, 0,
       1, 1, 1,     1, 1,
      -1, 1, 1,     0, 1,
    // trzecia ściana
      -1,-1,-1,     0, 0,
      -1, 1,-1,     1, 0,
      -1, 1, 1,     1, 1,
      -1,-1, 1,     0, 1,
    // czwarta ściana
       1,-1,-1,     0, 0,
       1, 1,-1,     1, 0,
       1, 1, 1,     1, 1,
       1,-1, 1,     0, 1,
    // piąta ściana
      -1,-1,-1,     0, 0,
      -1,-1, 1,     1, 0,
       1,-1, 1,     1, 1,
       1,-1,-1,     0, 1,
    // szósta ściana
      -1, 1,-1,     0, 0,
      -1, 1, 1,     1, 0,
       1, 1, 1,     1, 1,
       1, 1,-1,     0, 1
    ];
  } else {
    var triangleVertices = [
    // x,  y,  z,     u,   v,  
    // pierwsza ściana
      -1, -1, -1,   0.0, 0.0,
       1,  1, -1,   1.0, 0.0,
       1, -1,  1,   0.5, 1.0,
    // druga ściana
      -1, -1, -1,   0.5, 0.0,
      -1,  1,  1,   0.0, 1.0,
       1, -1,  1,   1.0, 1.0,
    // trzecia ściana
       1,  1, -1,   0.5, 0.0,
       1, -1,  1,   0.0, 1.0,
      -1,  1,  1,   1.0, 1.0,
    // czwarta ściana
      -1, -1, -1,   1.0, 0.0,
       1,  1, -1,   0.0, 0.0,
      -1,  1,  1,   0.5, 1.0
    ];
  }



  // Building Vertex Buffer Object - WebGL vertex array
  _triangleVertexBuffer = gl_ctx.createBuffer(); // *******
  gl_ctx.bindBuffer(gl_ctx.ARRAY_BUFFER, _triangleVertexBuffer);
  gl_ctx.bufferData(gl_ctx.ARRAY_BUFFER, new Float32Array(triangleVertices), gl_ctx.STATIC_DRAW);


  // Triangle faces array
  // var triangleFaces = [0, 1, 2];

  if (figureType) {
    var triangleFaces = [
      0,1,2,
      0,2,3,
      4,5,6,
      4,6,7,
      8,9,10,
      8,10,11,
      12,13,14,
      12,14,15,
      16,17,18,
      16,18,19,
      20,21,22,
      20,22,23
   ];
  } else {
    var triangleFaces = [
      0, 1, 2,
      3, 4, 5,
      6, 7, 8,
      9, 10, 11
   ];
  }


  _triangleFacesBuffer = gl_ctx.createBuffer(); // *******
  gl_ctx.bindBuffer(gl_ctx.ELEMENT_ARRAY_BUFFER, _triangleFacesBuffer);
  gl_ctx.bufferData(gl_ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangleFaces), gl_ctx.STATIC_DRAW);
}

// ==================================================================== //

function gl_setMatrix() {
  _matrixProjection = MATRIX.getProjection(40, gl_canvas.width / gl_canvas.height, 1, 100);
  _matrixMovement = MATRIX.getIdentityMatrix();
  _matrixView = MATRIX.getIdentityMatrix();

  MATRIX.translateZ(_matrixView, zoomRatio);
}

// ==================================================================== //

function gl_initTexture() {
  var img = new Image();
   img.src = 'cubeTexture.png';
   img.webglTexture = false;

   img.onload = function(e) {
      var texture = gl_ctx.createTexture();
      gl_ctx.pixelStorei(gl_ctx.UNPACK_FLIP_Y_WEBGL, true);
      gl_ctx.bindTexture(gl_ctx.TEXTURE_2D, texture);
      gl_ctx.texParameteri(gl_ctx.TEXTURE_2D, gl_ctx.TEXTURE_MIN_FILTER, gl_ctx.LINEAR);
      gl_ctx.texParameteri(gl_ctx.TEXTURE_2D, gl_ctx.TEXTURE_MAG_FILTER, gl_ctx.LINEAR);

      gl_ctx.texImage2D(gl_ctx.TEXTURE_2D, 0, gl_ctx.RGBA, gl_ctx.RGBA,
                        gl_ctx.UNSIGNED_BYTE, img);
      gl_ctx.bindTexture(gl_ctx.TEXTURE_2D, null);
      img.webglTexture = texture;
   };
   return img;
}


function gl_draw() {
  // zabezpieczenie przed przyspieszaniem animacji
  // przy każdym wywołaniu funkcji runWebGL()()
  if (animation) {
    window.cancelAnimationFrame(animation)
  }
  // ustawienie koloru czyszczenia
  gl_ctx.clearColor(0.0, 0.0, 0.0, 0.0);
  gl_ctx.enable(gl_ctx.DEPTH_TEST);
  gl_ctx.depthFunc(gl_ctx.LEQUAL);
  gl_ctx.clearDepth(1.0);

  var timeOld = 0;

  var animate = function (time) {
    // wyliczenie kąta obrotu bryły
    var dAngle = rotationSpeed * (time - timeOld);

    // Sprawdzenie wokół jakich osi ma być obracana bryła
    if (X) {
      MATRIX.rotateX(_matrixMovement, dAngle);
    }
    if (Y) {
      MATRIX.rotateY(_matrixMovement, dAngle);
    }
    if (Z) {
      MATRIX.rotateZ(_matrixMovement, dAngle);
    }
    
    timeOld = time;

    // ustawia obszar rysowania na canvas i czyści go
    gl_ctx.viewport(0.0, 0.0, gl_canvas.width, gl_canvas.height);
    gl_ctx.clear(gl_ctx.COLOR_BUFFER_BIT | gl_ctx.DEPTH_BUFFER_BIT);

    gl_ctx.uniformMatrix4fv(_PosMatrix, false, _matrixProjection);
    gl_ctx.uniformMatrix4fv(_MovMatrix, false, _matrixMovement);
    gl_ctx.uniformMatrix4fv(_ViewMatrix, false, _matrixView);
    
    if (_cubeTexture.webglTexture) {
      gl_ctx.activeTexture(gl_ctx.TEXTURE0);
      gl_ctx.bindTexture(gl_ctx.TEXTURE_2D, _cubeTexture.webglTexture);
    }
    
    // gl_ctx.vertexAttribPointer(variable, dimension, type, normalize, total vertex size in bytes, offset)
    if (figureType) {
      gl_ctx.vertexAttribPointer(_position, 3, gl_ctx.FLOAT, false, 4*(3+2), 0);
      gl_ctx.vertexAttribPointer(_uv, 2, gl_ctx.FLOAT, false, 4*(3+2), 3*4);
    } else {
      gl_ctx.vertexAttribPointer(_position, 3, gl_ctx.FLOAT, false, 4*(3+2), 0);
      gl_ctx.vertexAttribPointer(_uv, 2, gl_ctx.FLOAT, false, 4*(3+2), 4*3);
    }


    gl_ctx.bindBuffer(gl_ctx.ARRAY_BUFFER, _triangleVertexBuffer);
    gl_ctx.bindBuffer(gl_ctx.ELEMENT_ARRAY_BUFFER, _triangleFacesBuffer);

    // wyrysowanie bryły używając trójkątów zdefiniowanych w triangeFaces
    if (figureType) {
      gl_ctx.drawElements(gl_ctx.TRIANGLES, 6*2*3, gl_ctx.UNSIGNED_SHORT, 0);
    } else {
      gl_ctx.drawElements(gl_ctx.TRIANGLES, 3 * 4, gl_ctx.UNSIGNED_SHORT, 0);
    }

    // wyświetlenie wyrysowanych figur
    gl_ctx.flush();
    // przerysowanie sceny
    animation = window.requestAnimationFrame(animate);
  };

  // pierwsze uruchomienie animacji
  animate(0);
}
