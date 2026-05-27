AFRAME.registerComponent('xray-scanner', {
    schema: {
      targetName: { type: 'string', default: 'odalisque' },
      normalTex: { type: 'string' },
      skeletonTex: { type: 'string' }
    },
  
    init: function () {
      const data = this.data;
      const normalSrc = document.querySelector(data.normalTex).src;
      const skeletonSrc = document.querySelector(data.skeletonTex).src;
  
      this.uniforms = {
        textureNormal: { value: new THREE.TextureLoader().load(normalSrc) },
        textureSkeleton: { value: new THREE.TextureLoader().load(skeletonSrc) },
        u_transition: { value: 0.0 }
      };
  
      this.material = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform sampler2D textureNormal;
          uniform sampler2D textureSkeleton;
          uniform float u_transition;
  
          void main() {
            vec4 colorNormal = texture2D(textureNormal, vUv);
            vec4 colorSkeleton = texture2D(textureSkeleton, vUv);
  
            float wipe = smoothstep(u_transition - 0.05, u_transition + 0.05, vUv.x);
            
            float scanLine = smoothstep(u_transition - 0.02, u_transition, vUv.x) 
                           - smoothstep(u_transition, u_transition + 0.02, vUv.x);
            vec4 glowColor = vec4(0.2, 0.8, 1.0, 1.0) * scanLine * 1.5;
  
            vec4 finalColor = mix(colorSkeleton, colorNormal, wipe);
            gl_FragColor = finalColor + glowColor;
          }
        `,
        transparent: true
      });
  
      this.el.getObject3D('mesh').material = this.material;
  
      this.isScanning = false;
      const targetEntity = this.el.parentNode; 
  
      targetEntity.addEventListener('xrimagefound', (e) => {
        if (e.detail.name === data.targetName) {
          this.isScanning = true;
        }
      });
  
      targetEntity.addEventListener('xrimagelost', (e) => {
        if (e.detail.name === data.targetName) {
          this.isScanning = false;
          this.uniforms.u_transition.value = 0.0;
        }
      });
    },
  
    tick: function (time, timeDelta) {
      if (this.isScanning && this.uniforms.u_transition.value < 1.0) {
        this.uniforms.u_transition.value += (timeDelta / 2000);
      }
    }
  });
  