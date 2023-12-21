import type {Scene} from 'cesium';

let postUnlistener: Function = null;

interface ProgramInfo {
  program: WebGLProgram,
  attribLocations: {
    vertexPosition: number
  },
  uniformLocations: {
    uScaling: WebGLUniformLocation
  }
}


// CC0 from https://github.com/mdn/dom-examples/tree/main/webgl-examples/tutorial/sample2


export class MaskDrawer {
  private programInfo: ProgramInfo;
  private positionBuffer: WebGLBuffer;

  constructor(private gl: WebGL2RenderingContext | WebGLRenderingContext) {
    const shaderProgram = this.initShaderProgram();

    this.programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition')
      },
      uniformLocations: {
        uScaling: gl.getUniformLocation(
            shaderProgram,
            'uScaling'
        )
      }
    };

    this.positionBuffer = gl.createBuffer();
    const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  }

  getVertexShaderSource() {
    return `
      attribute vec4 aVertexPosition;
      uniform vec2 uScaling;
      void main() {
        gl_Position = vec4(aVertexPosition[0] * uScaling[0], aVertexPosition[1] * uScaling[1], -1.0, 1.0);
      }
    `;
  }

  getFragmentShaderSource() {
    return `
      precision highp float;
      void main() {
        gl_FragColor = vec4(.5, .5, .5, .6);
      }
  `;
  }

  /**
   *
   */
  private initShaderProgram(): WebGLProgram {
    const gl = this.gl;
    const vsSource = this.getVertexShaderSource();
    const fsSource = this.getFragmentShaderSource();
    const vertexShader = MaskDrawer.loadShader(gl, gl.VERTEX_SHADER, vsSource),
        fragmentShader = MaskDrawer.loadShader(gl, gl.FRAGMENT_SHADER, fsSource),
        shaderProgram = gl.createProgram();

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      throw new Error(
          `Unable to initialize the shader program: ${gl.getProgramInfoLog(
              shaderProgram
          )}`
      );
    }

    return shaderProgram;
  }


  /**
   *
   * @param {number[]} scaling scaling
   */
  drawMask(scaling: number[]) {
    const gl = this.gl;
    const programInfo = this.programInfo;
    // Blend
    gl.enable(gl.BLEND);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    gl.useProgram(programInfo.program);


    // Draw a first time to fill the stencil area while keeping the destination color
    gl.enable(gl.STENCIL_TEST);
    gl.stencilFunc(
        gl.ALWAYS,
        1,
        0xFF
    );
    gl.stencilOp(
        gl.KEEP,
        gl.KEEP,
        gl.REPLACE
    );
    gl.uniform2fv(
        programInfo.uniformLocations.uScaling,
        scaling
    );
    gl.blendFunc(gl.ZERO, gl.ONE);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);


    // Now draw again the whole viewport and darken the pixels that are not on the stencil
    gl.stencilFunc(
        gl.EQUAL,
        0,
        0xFF
    );
    gl.stencilOp(
        gl.KEEP,
        gl.KEEP,
        gl.KEEP
    );
    gl.uniform2fv(
        programInfo.uniformLocations.uScaling,
        [1, 1]
    );
    gl.blendFunc(gl.ZERO, gl.SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }



  /**
   */
  private static loadShader(gl: WebGL2RenderingContext | WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(
          `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
      );
      // gl.deleteShader(shader);
    }

    return shader;
  }
}

/**
 *
 */
export function autoDrawMask(scene: Scene, getScalings: () => number[]) {
  const canvas = scene.canvas;
  const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');

  if (getScalings) {
    if (!postUnlistener) {
      const drawer = new MaskDrawer(ctx);
      postUnlistener = scene.postRender.addEventListener(() => {
        drawer.drawMask(getScalings());
      });
    }
  }
  else if (postUnlistener) {
    postUnlistener();
    // FIXME: destroy program
    postUnlistener = null;
  }
  scene.requestRender();
}
