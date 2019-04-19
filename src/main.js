let game, light, level, gun, ammo, enemy, title, controls, player, audio;

const Map = (n, il, ih, ol, oh) => {
  return (n - il) * (oh - ol) / (ih - il) + ol;
};

const Color = (c, l) => {
  return c ? `hsl(40, 92%, ${l}%)` : `hsl(271, 18%, ${l}%)`;
};

const Random = (l, h) => {
  return Math.floor(Math.random() * (++h - l) + l);
};

function Setup() {
  game = {
    canvas: document.getElementsByTagName('canvas')[0],
    renderer: null,
    resolution: {
      w: window.innerWidth,
      h: window.innerHeight,
      s: 1 / Math.floor(Map(window.innerWidth, 0, 3840, 2, 4)),
    },
    camera: null,
    scene: new THREE.Scene(),
    composer: null,
    pass: null,
    isPlaying: false,
    time: 0,
    // stats: new Stats(),
  };

  game['renderer'] = new THREE.WebGLRenderer({
    canvas: game['canvas'],
  });
  game['renderer'].setSize(
    game['resolution']['w'] *= game['resolution']['s'], game['resolution']['h'] *= game['resolution']['s'], false);
  game['renderer'].setClearColor(Color(0, 5));
  game['renderer'].shadowMap.enabled = true;

  game['scene'].add(
    game['camera'] = new THREE.PerspectiveCamera(90, game['resolution']['w'] / game['resolution']['h'], .1, 1000));

  // document.body.appendChild(game['stats'].dom);

  World();
  Filter();
  Input();
  Draw();
}

function World() {
  light = {
    ambient: new THREE.AmbientLight(Color(0, 5), .5),
    point: new THREE.PointLight(Color(0, 95), .5, 100),
  };

  game['scene'].add(light['ambient']);

  game['camera'].add(light['point']);
  light['point'].position.set(5, 5, 5);
  light['point'].castShadow = true;
  light['point'].shadow.mapSize = new THREE.Vector2(64, 64);


  const uniforms = `
    uniform float uTime;
    uniform float uMorph;
    uniform float uDistort;
  `;
  const shaderVertex = `
    vec3 transformed = vec3(position);

    transformed.x += sin((position.x + uTime * .375) * 20.) * .0015 * uMorph;
    transformed.y += sin((position.y + uTime * .375) * 20.) * .0015 * uMorph;
    transformed.z += sin((position.z + uTime * .375) * 20.) * .0015 * uMorph;

    if (uDistort > 0.) {
      transformed.x += fract(sin(dot(position.x + uTime * .00000025, (12.9898, 78.233))) * 43758.5453123) * uDistort;
      transformed.y += fract(sin(dot(position.x + uTime * .00000025, (12.9898, 78.233))) * 43758.5453123) * uDistort;
      transformed.z += fract(sin(dot(position.x + uTime * .00000025, (12.9898, 78.233))) * 43758.5453123) * uDistort;
    }
  `;


  /*
                      4
    3--  --0         ---
    |      |          |
                7 | -   - | 5
    |      |          |
    2--  --1         ---
                      6
  */
  level = {
    map: `
      CHHHHHHHHHHHHHHHHHHHHHHHHHHHHC
      VFFFFFFFFFFFFFFFFFFFFFFFFFFFFV
      VFFFFFFFFFFFFFFFFFFFFFFFFFFFFV
      VFF3ehhh4ehhh4eh0FFFFFFF3e0FFV
      VFFvFFFFvFFFFvFFvFFFFFFFvFvFFV
      VFFvFFFFaFFFF7eh6hh4ehhh5FvFFV
      VFFvFFFFvFFFFvFFFFFvFFFF2e1FFV
      VFF2ehhh1FFFF2ehhhh1FFFFFFFFFV
      VFFFFFFFFFFFFFFFFFFFFFFFFFFFFV
      VFFFFFFFFFFFFFFFFFFFFFFFFFFFFV
      CHHHHHHHHHHHHHHHHHHHHHHHHHHHHC
    `,
    path: [],
    enemy: [],
    geometry: {
      o: new THREE.Geometry(),
      h: new THREE.Geometry(),
      v: new THREE.Geometry(),
      0: new THREE.Geometry(),
      1: new THREE.Geometry(),
      2: new THREE.Geometry(),
      3: new THREE.Geometry(),
      4: new THREE.Geometry(),
      5: new THREE.Geometry(),
      6: new THREE.Geometry(),
      7: new THREE.Geometry(),
    },
    material: [],
    shader: [],
    mesh: new THREE.Group(),
  };

  let ch, g;
  level['map'] = level['map'].split('\n');
  for (let r = 0, l = level['map'].length; r < l; r++) {
    for (let c = 0, l = level['map'][r].length; c < l; c++) {
      ch = level['map'][r].charAt(c);
      if (ch !== ' ') {
        switch (ch) {
          case 'F':
            g = new THREE.PlaneGeometry(20, 20);
            g.rotateX(270 * Math.PI / 180);
            g.translate(c * 20, -10, r * 20);
            level['geometry']['o'].merge(g);
            break;
          case 'H':
            g = new THREE.PlaneGeometry(20, 10);
            g.translate(c * 20, -10, r * 20);
            level['geometry']['o'].merge(g);
            break;
          case 'V':
            g = new THREE.PlaneGeometry(20, 10);
            g.rotateY(90 * Math.PI / 180);
            g.translate(c * 20, -10, r * 20);
            level['geometry']['o'].merge(g);
            break;
          case 'C':
            g = new THREE.CylinderGeometry(0, 20, 80);
            g.translate(c * 20, 0, r * 20);
            level['geometry']['o'].merge(g);
            break;
          default:
            level['path'].push(new THREE.Vector3(c * 20, 0, r * 20));
            g = new THREE.BoxGeometry(20, 20, 20);
            g.translate(c * 20, 0, r * 20);
            switch (ch) {
              case 'e':
                level['path'].pop();
                level['enemy'].push(new THREE.Vector3(c * 20, 0, r * 20));
              case 'h':
                level['geometry']['h'].merge(g);
                break;
              case 'a':
                game['camera'].position.set(c * 20, 0, r * 20);
              case 'v':
                level['geometry']['v'].merge(g);
                break;
              case '0':
                level['geometry']['0'].merge(g);
                break;
              case '1':
                level['geometry']['1'].merge(g);
                break;
              case '2':
                level['geometry']['2'].merge(g);
                break;
              case '3':
                level['geometry']['3'].merge(g);
                break;
              case '4':
                level['geometry']['4'].merge(g);
                break;
              case '5':
                level['geometry']['5'].merge(g);
                break;
              case '6':
                level['geometry']['6'].merge(g);
                break;
              case '7':
                level['geometry']['7'].merge(g);
                break;
            }
        }
      }
    }
  }

  level['material'].push(new THREE.MeshBasicMaterial({
    depthWrite: false,
    transparent: true,
    opacity: 0,
  }));
  level['material'].push(new THREE.MeshLambertMaterial({
    side: THREE.DoubleSide,
    color: Color(0, 25),
  }));
  level['material'].push(new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    opacity: .25,
    color: Color(1, 75),
  }));

  const l = new THREE.TextureLoader();
  const t = [];
  for (let i = 0; i < 6; i++) {
    t.push([]);
    for (let j = 0; j < 3; j++) {
      t[i].push(l.load(`jpg/${i}${j}.jpg`));
    }
  }
  let c = 0;
  for (let i = 0; i < 6; i++) {
    level['material'].push(new THREE.MeshLambertMaterial({
      side: THREE.DoubleSide,
      map: t[i][c],
    }));
  }
  setInterval(() => {
    if (++c > 2) {
      c = 0;
    }
    level['material'][3].map = t[0][c];
    level['material'][3].needsUpdate = true;
    level['material'][4].map = t[1][c];
    level['material'][4].needsUpdate = true;
    level['material'][5].map = t[2][c];
    level['material'][5].needsUpdate = true;
    level['material'][6].map = t[3][c];
    level['material'][6].needsUpdate = true;
    level['material'][7].map = t[4][c];
    level['material'][7].needsUpdate = true;
    level['material'][8].map = t[5][c];
    level['material'][8].needsUpdate = true;
  }, 500);

  for (let i = 1, l = level['material'].length; i < l; i++) {
    level['material'][i].onBeforeCompile = (s) => {
      level['shader'][i] = s;

      s.uniforms.uTime = {
        value: 0,
      };
      s.uniforms.uMorph = {
        value: 7.5,
      };
      s.uniforms.uDistort = {
        value: 5,
      };

      s.vertexShader = uniforms + s.vertexShader;
      s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', shaderVertex);
    };
  }

  game['scene'].add(level['mesh'].add(new THREE.Mesh(level['geometry']['o'], level['material'][1])));
  /*
    BoxGeometry faces:
      0,  1: east
      2,  3: west
      4,  5: top
      6,  7: bottom
      8,  9: south
     10, 11: north
  */
  level['mesh'].add(new THREE.Mesh(level['geometry']['h'], level['material']));
  for (let i = 0, l = level['geometry']['h'].faces.length; i < l; i++) {
    switch (i % 12) {
      case 4:
      case 5:
      case 6:
      case 7:
        level['geometry']['h'].faces[i].materialIndex = Random(6, 8);
        break;
      case 8:
      case 9:
      case 10:
      case 11:
        level['geometry']['h'].faces[i].materialIndex = Random(1, 5) === 1 ? Random(3, 5) : 2;
        break;
      default:
        level['geometry']['h'].faces[i].materialIndex = 0;
    }
  }
  level['mesh'].add(new THREE.Mesh(level['geometry']['v'], level['material']));
  for (let i = 0, l = level['geometry']['v'].faces.length; i < l; i++) {
    switch (i % 12) {
      case 0:
      case 1:
      case 2:
      case 3:
        level['geometry']['v'].faces[i].materialIndex = Random(1, 5) === 1 ? Random(3, 5) : 2;
        break;
      case 4:
      case 5:
      case 6:
      case 7:
        level['geometry']['v'].faces[i].materialIndex = Random(6, 8);
        break;
      default:
        level['geometry']['v'].faces[i].materialIndex = 0;
    }
  }
  level['mesh'].add(new THREE.Mesh(level['geometry']['0'], level['material']));
  for (let i = 0, l = level['geometry']['0'].faces.length; i < l; i++) {
    switch (i % 12) {
      case 0:
      case 1:
      case 10:
      case 11:
        level['geometry']['0'].faces[i].materialIndex = Random(1, 5) === 1 ? Random(3, 5) : 2;
        break;
      case 4:
      case 5:
      case 6:
      case 7:
        level['geometry']['0'].faces[i].materialIndex = Random(6, 8);
        break;
      default:
        level['geometry']['0'].faces[i].materialIndex = 0;
    }
  }
  level['mesh'].add(new THREE.Mesh(level['geometry']['1'], level['material']));
  for (let i = 0, l = level['geometry']['1'].faces.length; i < l; i++) {
    switch (i % 12) {
      case 0:
      case 1:
      case 8:
      case 9:
        level['geometry']['1'].faces[i].materialIndex = Random(1, 5) === 1 ? Random(3, 5) : 2;
        break;
      case 4:
      case 5:
      case 6:
      case 7:
        level['geometry']['1'].faces[i].materialIndex = Random(6, 8);
        break;
      default:
        level['geometry']['1'].faces[i].materialIndex = 0;
    }
  }
  level['mesh'].add(new THREE.Mesh(level['geometry']['2'], level['material']));
  for (let i = 0, l = level['geometry']['2'].faces.length; i < l; i++) {
    switch (i % 12) {
      case 2:
      case 3:
      case 8:
      case 9:
        level['geometry']['2'].faces[i].materialIndex = Random(1, 5) === 1 ? Random(3, 5) : 2;
        break;
      case 4:
      case 5:
      case 6:
      case 7:
        level['geometry']['2'].faces[i].materialIndex = Random(6, 8);
        break;
      default:
        level['geometry']['2'].faces[i].materialIndex = 0;
    }
  }
  level['mesh'].add(new THREE.Mesh(level['geometry']['3'], level['material']));
  for (let i = 0, l = level['geometry']['3'].faces.length; i < l; i++) {
    switch (i % 12) {
      case 2:
      case 3:
      case 10:
      case 11:
        level['geometry']['3'].faces[i].materialIndex = Random(1, 5) === 1 ? Random(3, 5) : 2;
        break;
      case 4:
      case 5:
      case 6:
      case 7:
        level['geometry']['3'].faces[i].materialIndex = Random(6, 8);
        break;
      default:
        level['geometry']['3'].faces[i].materialIndex = 0;
    }
  }
  level['mesh'].add(new THREE.Mesh(level['geometry']['4'], level['material']));
  for (let i = 0, l = level['geometry']['4'].faces.length; i < l; i++) {
    switch (i % 12) {
      case 4:
      case 5:
      case 6:
      case 7:
        level['geometry']['4'].faces[i].materialIndex = Random(6, 8);
        break;
      case 10:
      case 11:
        level['geometry']['4'].faces[i].materialIndex = Random(1, 5) === 1 ? Random(3, 5) : 2;
        break;
      default:
        level['geometry']['4'].faces[i].materialIndex = 0;
    }
  }
  level['mesh'].add(new THREE.Mesh(level['geometry']['5'], level['material']));
  for (let i = 0, l = level['geometry']['5'].faces.length; i < l; i++) {
    switch (i % 12) {
      case 0:
      case 1:
        level['geometry']['5'].faces[i].materialIndex = Random(1, 5) === 1 ? Random(3, 5) : 2;
        break;
      case 4:
      case 5:
      case 6:
      case 7:
        level['geometry']['5'].faces[i].materialIndex = Random(6, 8);
        break;
      default:
        level['geometry']['5'].faces[i].materialIndex = 0;
    }
  }
  level['mesh'].add(new THREE.Mesh(level['geometry']['6'], level['material']));
  for (let i = 0, l = level['geometry']['6'].faces.length; i < l; i++) {
    switch (i % 12) {
      case 4:
      case 5:
      case 6:
      case 7:
        level['geometry']['6'].faces[i].materialIndex = Random(6, 8);
        break;
      case 8:
      case 9:
        level['geometry']['6'].faces[i].materialIndex = Random(1, 5) === 1 ? Random(3, 5) : 2;
        break;
      default:
        level['geometry']['6'].faces[i].materialIndex = 0;
    }
  }
  level['mesh'].add(new THREE.Mesh(level['geometry']['7'], level['material']));
  for (let i = 0, l = level['geometry']['7'].faces.length; i < l; i++) {
    switch (i % 12) {
      case 2:
      case 3:
        level['geometry']['7'].faces[i].materialIndex = Random(1, 5) === 1 ? Random(3, 5) : 2;
        break;
      case 4:
      case 5:
      case 6:
      case 7:
        level['geometry']['7'].faces[i].materialIndex = Random(6, 8);
        break;
      default:
        level['geometry']['7'].faces[i].materialIndex = 0;
    }
  }
  level['geometry']['h'].merge(level['geometry']['v']);
  level['geometry']['h'].merge(level['geometry']['0']);
  level['geometry']['h'].merge(level['geometry']['1']);
  level['geometry']['h'].merge(level['geometry']['2']);
  level['geometry']['h'].merge(level['geometry']['3']);
  level['geometry']['h'].merge(level['geometry']['4']);
  level['geometry']['h'].merge(level['geometry']['5']);
  level['geometry']['h'].merge(level['geometry']['6']);
  level['geometry']['h'].merge(level['geometry']['7']);
  level['mesh'].add(new THREE.LineSegments(new THREE.EdgesGeometry(level['geometry']['h']), level['material'][1]));
  for (let i = 0, l = level['mesh'].children.length; i < l; i++) {
    level['mesh'].children[i].receiveShadow = true;
  }


  gun = {
    material: new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0,
      vertexColors: THREE.FaceColors,
    }),
    shader: null,
    mesh: new THREE.Group(),
    rotation: new THREE.Vector3(),
    isShooting: false,
    isRotating: false,
    isSecondary: false,
    isMoving: false,
  };

  gun['material'].onBeforeCompile = (s) => {
    gun['shader'] = s;

    s.uniforms.uTime = {
      value: 0,
    };
    s.uniforms.uMorph = {
      value: 2.5,
    };

    s.vertexShader = uniforms + s.vertexShader;
    s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', shaderVertex);
  };

  game['camera'].add(gun['mesh'].add(new THREE.Mesh(new THREE.BoxGeometry(.2, .4, .8), gun['material'])));
  gun['mesh'].position.set(0, -.75, -2);
  gun['mesh'].children[0].geometry.faces.forEach((f) => {
    return f.color.set(Color(0, Random(75, 100)));
  });
  gun['mesh'].add(new THREE.Mesh(new THREE.BoxGeometry(.175, .2, .175), gun['material']));
  gun['mesh'].children[1].geometry.faces.forEach((f) => {
    return f.color.set(Color(0, Random(25, 50)));
  });
  gun['mesh'].children[1].position.set(0, -.3, .3);


  ammo = {
    material: new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0,
      color: Color(1, Random(65, 75)),
    }),
    shader: null,
    mesh: [],
    count: 9,
  };

  ammo['material'].onBeforeCompile = (s) => {
    ammo['shader'] = s;

    s.uniforms.uTime = {
      value: 0,
    };
    s.uniforms.uMorph = {
      value: 1,
    };
    s.uniforms.uDistort = {
      value: .02,
    };

    s.vertexShader = uniforms + s.vertexShader;
    s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', shaderVertex);
  };


  enemy = {
    material: new THREE.MeshLambertMaterial({
      opacity: 1,
      color: Color(1, Random(65, 75)),
    }),
    shader: null,
    mesh: [],
    health: [],
    isClose: false,
  };

  enemy['material'].onBeforeCompile = (s) => {
    enemy['shader'] = s;

    s.uniforms.uTime = {
      value: 0,
    };
    s.uniforms.uMorph = {
      value: 5,
    };
    s.uniforms.uDistort = {
      value: 5,
    };

    s.vertexShader = uniforms + s.vertexShader;
    s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', shaderVertex);
  };


  title = {
    material: new THREE.MeshLambertMaterial({
      color: Color(1, 75),
    }),
    shader: null,
    mesh: null,
  };

  title['material'].onBeforeCompile = (s) => {
    title['shader'] = s;

    s.uniforms.uTime = {
      value: 0,
    };
    s.uniforms.uMorph = {
      value: 5,
    };
    s.uniforms.uDistort = {
      value: .25,
    };

    s.vertexShader = uniforms + s.vertexShader;
    s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', shaderVertex);
  };


  new THREE.FontLoader().load('json/Pomeranian_Regular.json', (f) => {
    const p = {
      font: f,
      size: .1,
      height: .01,
    },
    t = '!一二三四五六七八九';

    for (let i = 0, l = t.length; i < l; i++) {
      ammo['mesh'][i] = new THREE.Mesh(new THREE.TextBufferGeometry(t.charAt(i), p), ammo['material']);
      ammo['mesh'][i].position.set(.15, .25, -.4);
    }
    gun['mesh'].add(ammo['mesh'][9]);

    p['size'] = 5;
    for (let i = 1, l = t.length; i < l; i++) {
      game['scene'].add(
        enemy['mesh'][i - 1] = new THREE.Mesh(new THREE.TextBufferGeometry(t.charAt(i), p), enemy['material']));
      enemy['mesh'][i - 1].rotation.set(0, 90 * Math.PI / 180, 0);
      enemy['mesh'][i - 1].position.set(
        level['enemy'][i - 1].x, level['enemy'][i - 1].y - 2.75, level['enemy'][i - 1].z + 5.5);
      enemy['mesh'][i - 1].castShadow = true;
      enemy['health'].push(2 + Math.floor(i / 2));
    }

    p['size'] = 1;
    game['scene'].add(title['mesh'] = new THREE.Mesh(new THREE.TextBufferGeometry('waraws\nBARELY\nOPAQUE\nRED', p),
      title['material']));
    title['mesh'].position.set(
      game['camera'].position.x - 4.25, game['camera'].position.y + 3.1875, game['camera'].position.z - 10);
  });
}

function Filter() {
  game['composer'] = new THREE.EffectComposer(game['renderer']);
  game['composer'].addPass(new THREE.RenderPass(game['scene'], game['camera']));
  game['composer'].addPass(game['pass'] = new THREE.ShaderPass({
    uniforms: {
      tDiffuse: {
        value: null,
      },
      uPixelSize: {
        value: 1,
      },
      uResolution: {
        value: new THREE.Vector2(game['resolution']['w'], game['resolution']['h']),
      },
      uTime: {
        value: 0,
      },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uPixelSize;
      uniform vec2 uResolution;
      uniform float uTime;

      varying vec2 vUv;

      float random(vec2 uv) {
        return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      void main() {
        vec4 pixelated = texture2D(tDiffuse, uPixelSize / uResolution * floor(vUv / (uPixelSize / uResolution)));
        vec4 noisy = pixelated * .9875 + random(vUv * (sin(uTime) + 10.)) * .0125;
        gl_FragColor = vec4(noisy.r, (noisy.g + noisy.b) * .5, (noisy.g + noisy.b) * .5, 1.);
      }
    `,
  }));
  game['pass'].renderToScreen = true;
}

function Sound() {
  audio = {
    listener: new THREE.AudioListener(),
    drum: [],
    bass: [],
    lead: [],
    step: null,
    turn: null,
    fire: [],
    indexDrum: 0,
    indexBassLead: 0,
  };

  game['camera'].add(audio['listener']);

  for (let i = 0; i < 3; i++) {
    audio['drum'].push(new THREE.Audio(audio['listener']));
    audio['bass'].push(new THREE.Audio(audio['listener']));
    audio['lead'].push(new THREE.Audio(audio['listener']));

    new THREE.AudioLoader().load(`mp3/d${i}.mp3`, (b) => {
      audio['drum'][i].setBuffer(b);
      if (i === 2) {
        setInterval(() => {
          if (audio['drum'][audio['indexDrum']].isPlaying) {
            audio['drum'][audio['indexDrum']].stop();
          }
          Random(0, 1) ? audio['indexDrum']++ : audio['indexDrum']--;
          if (audio['indexDrum'] < 0) {
            audio['indexDrum'] = 2;
          } else if (audio['indexDrum'] > 2) {
            audio['indexDrum'] = 0;
          }
          audio['drum'][audio['indexDrum']].play();
        }, 4000);
      }
    });
    new THREE.AudioLoader().load(`mp3/b${i}.mp3`, (b) => {
      audio['bass'][i].setBuffer(b);
      if (i === 2) {
        setInterval(() => {
          if (audio['bass'][audio['indexBassLead']].isPlaying) {
            audio['bass'][audio['indexBassLead']].stop();
          }
          Random(0, 1) ? audio['indexBassLead']++ : audio['indexBassLead']--;
          if (audio['indexBassLead'] < 0) {
            audio['indexBassLead'] = 2;
          } else if (audio['indexBassLead'] > 2) {
            audio['indexBassLead'] = 0;
          }
          if (Random(0, 1)) {
            audio['bass'][audio['indexBassLead']].play();
          }
        }, 2000);
      }
    });
    new THREE.AudioLoader().load(`mp3/l${i}.mp3`, (b) => {
      audio['lead'][i].setBuffer(b);
      if (i === 2) {
        setInterval(() => {
          if (audio['lead'][audio['indexBassLead']].isPlaying) {
            audio['lead'][audio['indexBassLead']].stop();
          }
          audio['lead'][audio['indexBassLead']].play();
        }, 2000);
      }
    });
  }
  audio['step'] = new THREE.Audio(audio['listener']);
  new THREE.AudioLoader().load(`mp3/s0.mp3`, (b) => {
    audio['step'].setBuffer(b);
  });
  audio['turn'] = new THREE.Audio(audio['listener']);
  new THREE.AudioLoader().load(`mp3/t0.mp3`, (b) => {
    audio['turn'].setBuffer(b);
  });
  for (let i = 0; i < 2; i++) {
    audio['fire'].push(new THREE.Audio(audio['listener']));
    new THREE.AudioLoader().load(`mp3/f${i}.mp3`, (b) => {
      audio['fire'][i].setBuffer(b);
    });
  }

  window.onblur = () => {
    for (let i = 0, l = audio['drum'].length; i < l; i++) {
      audio['drum'][i].setVolume(0);
      audio['bass'][i].setVolume(0);
      audio['lead'][i].setVolume(0);
    }
  };
  window.onfocus = () => {
    for (let i = 0, l = audio['drum'].length; i < l; i++) {
      audio['drum'][i].setVolume(1);
      audio['bass'][i].setVolume(1);
      audio['lead'][i].setVolume(1);
    }
  };
}

function Input() {
  window.ondeviceorientation = window.onresize = () => {
    game['resolution']['s'] = 1 / Math.floor(Map(window.innerWidth, 0, 3840, 2, 4));
    game['renderer'].setSize(game['resolution']['w'] = window.innerWidth * game['resolution']['s'],
      game['resolution']['h'] = window.innerHeight * game['resolution']['s'], false);

    game['camera'].aspect = game['resolution']['w'] / game['resolution']['h'];
    game['camera'].updateProjectionMatrix();

    game['pass'].uniforms.uResolution.value = new THREE.Vector2(game['resolution']['w'], game['resolution']['h']);
    game['composer'].reset();
  };


  controls = {
    touch: {
      s: {
        x: 0,
        y: 0,
      },
      e: {
        x: 0,
        y: 0,
      },
      m: {
        x: 0,
        y: 0,
      },
    },
    swipe: '',
    mouse: {
      x: 0,
      y: 0,
    },
    areLocked: true,
  };

  player = {
    rotation: new THREE.Vector3(),
    position: new THREE.Vector3(),
    isFacing: {
      v: ['north', 'west', 'south', 'east'],
      i: 0,
    },
    isMoving: false,
    move: '',
    isAiming: false,
    look: '',
  };


  const Start = () => {
    game['isPlaying'] = true;
    controls['areLocked'] = false;

    Sound();
    setTimeout(() => {
      game['scene'].remove(title['mesh']);

      Move('forward');
    }, 2000);
  };

  const Turn = () => {
    if (audio['turn'].isPlaying) {
      audio['turn'].stop();
    }
    audio['turn'].play();
  };

  const Move = (d) => {
    controls['areLocked'] = true;

    player['rotation'].copy(game['camera'].rotation);
    player['position'].copy(game['camera'].position);

    player['isMoving'] = true;

    switch (d) {
      case 'forward':
        if (audio['step'].isPlaying) {
          audio['step'].stop();
        }
        audio['step'].play();

        player['move'] = 'forward';
        break;
      case 'backward':
        Turn();

        player['move'] = 'backward';

        player['isFacing']['i'] += 2;
        if (player['isFacing']['i'] > 2) {
          player['isFacing']['i'] -= 4;
          if (player['isFacing']['i'] < 0) {
            player['isFacing']['i'] += 4;
          }
        }

        switch (player['look']) {
          case 'center-to-left':
            player['rotation'].y += 150 * Math.PI / 180;
            break;
          case 'center-to-right':
            player['rotation'].y -= 150 * Math.PI / 180;
            break;
          default:
            player['rotation'].y += Math.PI;
        }
        break;
      case 'left':
        Turn();

        player['move'] = 'left';

        player['isFacing']['i']++;
        if (player['isFacing']['i'] > 3) {
          player['isFacing']['i'] -= 4;
        }

        player['rotation'].y += 60 * Math.PI / 180;
        break;
      case 'right':
        Turn();

        player['move'] = 'right';

        player['isFacing']['i']--;
        if (player['isFacing']['i'] < 0) {
          player['isFacing']['i'] += 4;
        }

        player['rotation'].y -= 60 * Math.PI / 180;
        break;
    }
  };

  const Shoot = () => {
    if (!gun['isShooting'] && !gun['isRotating']) {
      if (gun['isSecondary']) {
        if (audio['fire'][1].isPlaying) {
          audio['fire'][1].stop();
        }
        audio['fire'][1].play();
      } else {
        if (audio['fire'][0].isPlaying) {
          audio['fire'][0].stop();
        }
        audio['fire'][0].play();
      }

      gun['isShooting'] = true;
      gun['mesh'].remove(ammo['mesh'][ammo['count']]);
      if (!ammo['count']) {
        ammo['count'] = 10;
      }
      ammo['material'].color = new THREE.Color(Color(1, Random(65, 75)));
      gun['mesh'].add(ammo['mesh'][--ammo['count']]);

      for (let i = 0; i < level['enemy'].length; i++) {
        if (Math.abs(level['enemy'][i].x - game['camera'].position.x) <= 20 &&
          level['enemy'][i].z === player['position'].z) {
          if (!gun['isSecondary'] && enemy['shader'].uniforms.uDistort.value < 5) {
            enemy['health'][i]--;
          }
        }
      }
    }
  };


  game['canvas'].ontouchstart = (e) => {
    e.preventDefault();
  };

  window.ontouchstart = (e) => {
    if (!controls['areLocked']) {
      controls['touch']['s']['x'] = e.changedTouches[0].clientX / window.innerWidth * 2 - 1;
      controls['touch']['s']['y'] = e.changedTouches[0].clientY / window.innerHeight * -2 + 1;
    }
  };

  window.ontouchend = (e) => {
    if (game['isPlaying']) {
      if (!controls['areLocked']) {
        controls['touch']['e']['x'] = e.changedTouches[0].clientX / window.innerWidth * 2 - 1;
        controls['touch']['e']['y'] = e.changedTouches[0].clientY / window.innerHeight * -2 + 1;

        controls['swipe'] = '';
        if (Math.abs(controls['touch']['s']['x'] - controls['touch']['e']['x']) > .25) {
          if (controls['touch']['s']['x'] - controls['touch']['e']['x'] < 0) {
            controls['swipe'] += 'right';
          } else {
            controls['swipe'] += 'left';
          }
        }
        if (Math.abs(controls['touch']['s']['y'] - controls['touch']['e']['y']) > .25) {
          if (controls['touch']['s']['y'] - controls['touch']['e']['y'] < 0) {
            controls['swipe'] += 'up';
          } else {
            controls['swipe'] += 'down';
          }
        }

        if (player['isAiming']) {
          switch (controls['swipe']) {
            case '':
              Shoot();
              break;
            case 'up':
              if (!gun['isSecondary']) {
                Turn();

                gun['isRotating'] = true;
              }
              break;
            case 'down':
              Turn();

              if (gun['isSecondary']) {
                gun['isRotating'] = true;
              } else {
                player['isAiming'] = false;

                for (let i = 0, l = gun['mesh'].children.length - 1; i < l; i++) {
                  gun['mesh'].children[i].castShadow = false;
                }
              }
              break;
          }
        } else {
          switch (controls['swipe']) {
            case '':
              switch (player['look']) {
                case 'center-to-left':
                  Move('left');
                  break;
                case 'center-to-right':
                  Move('right');
                  break;
                default:
                  Move('forward');
              }
              break;
            case 'right':
              if (player['look'] === 'center-to-right') {
                player['look'] = 'right-to-center';
              } else if (player['look'] === 'center-to-left') {
                Move('left');
              } else {
                player['look'] = 'center-to-left';
              }
              break;
            case 'left':
              if (player['look'] === 'center-to-left') {
                player['look'] = 'left-to-center';
              } else if (player['look'] === 'center-to-right') {
                Move('right');
              } else {
                player['look'] = 'center-to-right';
              }
              break;
            case 'down':
              Move('backward');
              break;
            case 'up':
              Turn();

              player['isAiming'] = true;

              for (let i = 0, l = gun['mesh'].children.length - 1; i < l; i++) {
                gun['mesh'].children[i].castShadow = true;
              }
              break;
          }
        }
      }
    } else {
      Start();
    }
  };

  window.ontouchmove = (e) => {
    if (!controls['areLocked'] && player['isAiming']) {
      controls['touch']['m']['x'] = e.changedTouches[0].clientX / window.innerWidth * 2 - 1;
      controls['touch']['m']['y'] = e.changedTouches[0].clientY / window.innerHeight * -2 + 1;
        
      gun['rotation'].y = -controls['touch']['m']['x'];
    }
  };


  window.onmousemove = (e) => {
    if (!controls['areLocked']) {
      controls['mouse']['x'] = e.clientX / window.innerWidth * 2 - 1;
      controls['mouse']['y'] = e.clientY / window.innerHeight * -2 + 1;

      if (player['isAiming']) {
        gun['rotation'].y = -controls['mouse']['x'];
        gun['rotation'].x = controls['mouse']['y'] / 2;
      } else {
        if (controls['mouse']['x'] < -.5) {
          player['look'] = 'center-to-left';
        } else if (controls['mouse']['x'] > -.5 && controls['mouse']['x'] < 0) {
          player['look'] = 'left-to-center';
        } else if (controls['mouse']['x'] > .5) {
          player['look'] = 'center-to-right';
        } else if (controls['mouse']['x'] < .5 && controls['mouse']['x'] > 0) {
          player['look'] = 'right-to-center';
        }
      }
    }
  };

  let c = 0;
  window.onmousedown = () => {
    if (game['isPlaying']) {
      if (!controls['areLocked']) {
        if (player['isAiming']) {
          Shoot();
        } else {
          if (controls['mouse']['y'] < -.5) {
            Move('backward');
          } else {
            if (controls['mouse']['x'] > -.5 && controls['mouse']['x'] < .5) {
              Move('forward');
            } else if (controls['mouse']['x'] > .5) {
              Move('right');
            } else if (controls['mouse']['x'] < -.5) {
              Move('left');
            }
          }
        }
        if (!(++c % 3)) {

        }
      }
    } else {
      Start();
    }
  };

  window.onkeydown = (e) => {
    switch (e.code) {
      case 'KeyR':
        if (player['isAiming']) {
          gun['isRotating'] = true;
        }
        break;
      case 'KeyG':
        if (!controls['areLocked']) {
          Turn();

          player['isAiming'] = !player['isAiming'];

          if (gun['isSecondary']) {
            gun['isRotating'] = true;
          }

          for (let i = 0, l = gun['mesh'].children.length - 1; i < l; i++) {
            gun['mesh'].children[i].castShadow = !gun['mesh'].children[i].castShadow;
          }
        }
        break;
    }
  };
}

function Draw(t) {
  requestAnimationFrame(Draw);

  game['time'] = t / 1000;

  for (let i = 1, l = level['material'].length; i < l; i++) {
    if (level['shader'][i]) {
      level['shader'][i].uniforms.uTime.value = game['time'];
    }
  }
  if (gun['shader']) {
    gun['shader'].uniforms.uTime.value = game['time'];
  }
  if (ammo['shader']) {
    ammo['shader'].uniforms.uTime.value = game['time'];
  }
  if (enemy['shader']) {
    enemy['shader'].uniforms.uTime.value = game['time'];
  }
  if (title['shader']) {
    title['shader'].uniforms.uTime.value = game['time'];
  }

  if (player['isMoving']) {
    enemy['isClose'] = false;
    for (let i = 0; i < level['enemy'].length; i++) {
      if (Math.abs(level['enemy'][i].x - game['camera'].position.x) <= 20 &&
        level['enemy'][i].z === player['position'].z) {
        enemy['isClose'] = true;
      }
    }
    if (!enemy['isClose'] && enemy['shader'].uniforms.uDistort.value < 5) {
      enemy['shader'].uniforms.uDistort.value = 5;
    }

    switch (player['move']) {
      case 'forward':
        switch (player['isFacing']['v'][player['isFacing']['i']]) {
          case 'north':
            for (let i = 0, l = level['path'].length; i < l; i++) {
              if (player['position'].x === level['path'][i].x &&
                player['position'].z === level['path'][i].z + 20) {
                game['camera'].position.z -= .5;
                if (game['camera'].position.z < player['position'].z - 20) {
                  game['camera'].position.z = player['position'].z - 20;
                  player['isMoving'] = controls['areLocked'] = false;
                }
              }
            }
            if (player['position'].z === game['camera'].position.z) {
              player['isMoving'] = controls['areLocked'] = false;
            }
            break;
          case 'west':
            for (let i = 0, l = level['path'].length; i < l; i++) {
              if (player['position'].x === level['path'][i].x + 20 &&
                player['position'].z === level['path'][i].z) {
                game['camera'].position.x -= .5;
                if (game['camera'].position.x < player['position'].x - 20) {
                  game['camera'].position.x = player['position'].x - 20;
                  player['isMoving'] = controls['areLocked'] = false;
                }
              }
            }
            if (player['position'].x === game['camera'].position.x) {
              player['isMoving'] = controls['areLocked'] = false;
            }
            break;
          case 'south':
            for (let i = 0, l = level['path'].length; i < l; i++) {
              if (player['position'].x === level['path'][i].x &&
                player['position'].z === level['path'][i].z - 20) {
                game['camera'].position.z += .5;
                if (game['camera'].position.z > player['position'].z + 20) {
                  game['camera'].position.z = player['position'].z + 20;
                  player['isMoving'] = controls['areLocked'] = false;
                }
              }
            }
            if (player['position'].z === game['camera'].position.z) {
              player['isMoving'] = controls['areLocked'] = false;
            }
            break;
          case 'east':
            for (let i = 0, l = level['path'].length; i < l; i++) {
              if (player['position'].x === level['path'][i].x - 20 &&
                player['position'].z === level['path'][i].z) {
                game['camera'].position.x += .5;
                if (game['camera'].position.x > player['position'].x + 20) {
                  game['camera'].position.x = player['position'].x + 20;
                  player['isMoving'] = controls['areLocked'] = false;
                }
              }
            }
            if (player['position'].x === game['camera'].position.x) {
              player['isMoving'] = controls['areLocked'] = false;
            }
            break;
          }
        break;
      case 'left':
      case 'backward':
        if (player['look'] === 'center-to-right') {
          game['camera'].rotation.y -= .1;
          if (game['camera'].rotation.y < player['rotation'].y) {
            game['camera'].rotation.y = player['rotation'].y;
            player['isMoving'] = controls['areLocked'] = false;
          }
        } else {
          game['camera'].rotation.y += .1;
          if (game['camera'].rotation.y > player['rotation'].y) {
            game['camera'].rotation.y = player['rotation'].y;
            player['isMoving'] = controls['areLocked'] = false;
          }
        }
        break;
      case 'right':
        game['camera'].rotation.y -= .1;
        if (game['camera'].rotation.y < player['rotation'].y) {
          game['camera'].rotation.y = player['rotation'].y;
          player['isMoving'] = controls['areLocked'] = false;
        }
        break;
    }
  } else {
    if (player['isAiming']) {
      if (gun['material']['opacity'] < 1) {
        if (gun['material'].depthFunc !== THREE.LessEqualDepth) {
          gun['material'].depthFunc = ammo['material'].depthFunc = THREE.LessEqualDepth;
          gun['material'].needsUpdate = ammo['material'].needsUpdate = true;
        }
        gun['material']['opacity'] = ammo['material']['opacity'] += .05;
      } else {
        gun['material'].opacity = ammo['material'].opacity = 1;
      }

      if (gun['mesh'].rotation.y > gun['rotation'].y + .05) {
        gun['mesh'].rotation.y -= .05;
      } else if (gun['mesh'].rotation.y < gun['rotation'].y - .05) {
        gun['mesh'].rotation.y += .05;
      }
      if (gun['mesh'].rotation.x > gun['rotation'].x + .05) {
        gun['mesh'].rotation.x -= .05;
      } else if (gun['mesh'].rotation.x < gun['rotation'].x - .05) {
        gun['mesh'].rotation.x += .05;
      }

      if (gun['isShooting']) {
        if (gun['isMoving']) {
          if (gun['isMoving'] === 'forward') {
            gun['mesh'].children[0].position.z += .0125;

            if (gun['isSecondary']) {
              gun['isRotating'] = true;

              gun['shader'].uniforms.uMorph.value = ammo['shader'].uniforms.uMorph.value += 6.25;
              if (enemy['isClose']) {
                enemy['shader'].uniforms.uMorph.value += 250;

                enemy['shader'].uniforms.uDistort.value -= .5;
                if (enemy['shader'].uniforms.uDistort.value < 1) {
                  enemy['shader'].uniforms.uDistort.value = 1;
                }
              }
            } else {
              gun['shader'].uniforms.uMorph.value = ammo['shader'].uniforms.uMorph.value += 1.25;
              if (enemy['isClose']) {
                enemy['shader'].uniforms.uMorph.value += 125;
              }
            }
          } else if (gun['isMoving'] === 'backward') {
            gun['mesh'].children[0].position.z -= .0125;

            if (gun['isSecondary']) {
              gun['shader'].uniforms.uMorph.value = ammo['shader'].uniforms.uMorph.value -= 6.25;
              if (enemy['isClose']) {
                enemy['shader'].uniforms.uMorph.value -= 250;
              }
            } else {
              gun['shader'].uniforms.uMorph.value = ammo['shader'].uniforms.uMorph.value -= 1.25;
              if (enemy['isClose']) {
                enemy['shader'].uniforms.uMorph.value -= 125;
              }
            }
          }

          if (gun['mesh'].children[0].position.z >= .1) {
            gun['isMoving'] = '';
          } else if (gun['mesh'].children[0].position.z < 0) {
            gun['isShooting'] = false;
            gun['isMoving'] = '';

            gun['mesh'].children[0].position.z = 0;

            gun['shader'].uniforms.uMorph.value = ammo['shader'].uniforms.uMorph.value = 2.5;
            if (enemy['isClose']) {
              enemy['shader'].uniforms.uMorph.value = 5;
            }
          }
        } else {
          gun['isMoving'] = gun['mesh'].children[0].position.z < .1 ? 'forward' : 'backward';
        }

        for (let i = 0; i < level['enemy'].length; i++) {
          if (!enemy['health'][i]) {
            if (!enemy['material'].transparent) {
              enemy['material'].transparent = true;
            }
            enemy['material'].opacity -= .05;
            if (enemy['material'].opacity < 0) {
              enemy['health'].splice(i, 1);
              level['path'].push(level['enemy'][i]);
              level['enemy'].splice(i, 1);
              game['scene'].remove(enemy['mesh'][i]);
              enemy['mesh'].splice(i, 1);
              enemy['shader'].uniforms.uDistort.value = 5;
              enemy['isClose'] = false;
              enemy['material'].transparent = false;
              enemy['material'].opacity = 1;
            }
          }
        }
      }

      if (gun['isRotating']) {
        if (gun['isSecondary']) {
          gun['mesh'].rotation.z -= .05;
          for (let i = 0, l = ammo['mesh'].length; i < l; i++) {
            ammo['mesh'][i].rotation.z += .05;
          }
          if (gun['mesh'].rotation.z < 0) {
            gun['isRotating'] = false;
            gun['isSecondary'] = false;
            gun['mesh'].rotation.z = 0;
            for (let i = 0, l = ammo['mesh'].length; i < l; i++) {
              ammo['mesh'][i].rotation.z = 0;
            }
          }
        } else {
          gun['mesh'].rotation.z += .05;
          for (let i = 0, l = ammo['mesh'].length; i < l; i++) {
            ammo['mesh'][i].rotation.z -= .05;
          }
          if (gun['mesh'].rotation.z > 90 * Math.PI / 180) {
            gun['isRotating'] = false;
            gun['isSecondary'] = true;
            gun['mesh'].rotation.z = 90 * Math.PI / 180;
            for (let i = 0, l = ammo['mesh'].length; i < l; i++) {
              ammo['mesh'][i].rotation.z = -90 * Math.PI / 180;
            }
          }
        }
      }
    } else {
      if (gun['material']['opacity'] > 0) {
        gun['material']['opacity'] = ammo['material']['opacity'] -= .05;
      } else {
        gun['material'].opacity = ammo['material'].opacity = 0;
        gun['material'].depthFunc = ammo['material'].depthFunc = THREE.GreaterEqualDepth;
        gun['material'].needsUpdate = ammo['material'].needsUpdate = true;
      }

      if (player['look'] === 'center-to-left') {
        controls['areLocked'] = true;
        game['camera'].rotation.y += .05;
        if (game['camera'].rotation.y > player['rotation'].y + 30 * Math.PI / 180) {
          controls['areLocked'] = false;
          game['camera'].rotation.y = player['rotation'].y + 30 * Math.PI / 180;
        }
      } else if (player['look'] === 'left-to-center') {
        controls['areLocked'] = true;
        game['camera'].rotation.y -= .05;
        if (game['camera'].rotation.y < player['rotation'].y) {
          controls['areLocked'] = false;
          game['camera'].rotation.y = player['rotation'].y;
        }
      } else if (player['look'] === 'center-to-right') {
        controls['areLocked'] = true;
        game['camera'].rotation.y -= .05;
        if (game['camera'].rotation.y < player['rotation'].y - 30 * Math.PI / 180) {
          controls['areLocked'] = false;
          game['camera'].rotation.y = player['rotation'].y - 30 * Math.PI / 180;
        }
      } else if (player['look'] === 'right-to-center') {
        controls['areLocked'] = true;
        game['camera'].rotation.y += .05;
        if (game['camera'].rotation.y > player['rotation'].y) {
          controls['areLocked'] = false;
          game['camera'].rotation.y = player['rotation'].y;
        }
      }
    }
  }

  game['pass'].uniforms.uTime.value = game['time'];
  game['composer'].render();

  // game['stats'].update();
}