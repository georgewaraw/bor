THREE.RenderPass=function(e,r,a,t,l){THREE.Pass.call(this),this.scene=e,this.camera=r,this.overrideMaterial=a,this.clearColor=t,this.clearAlpha=void 0!==l?l:0,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1},THREE.RenderPass.prototype=Object.assign(Object.create(THREE.Pass.prototype),{constructor:THREE.RenderPass,render:function(e,r,a,t,l){var s=e.autoClear,o,i;e.autoClear=!1,this.scene.overrideMaterial=this.overrideMaterial,this.clearColor&&(o=e.getClearColor().getHex(),i=e.getClearAlpha(),e.setClearColor(this.clearColor,this.clearAlpha)),this.clearDepth&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:a),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor&&e.setClearColor(o,i),this.scene.overrideMaterial=null,e.autoClear=s}});