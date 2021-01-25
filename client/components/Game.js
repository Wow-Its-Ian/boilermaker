import React, {Component} from 'react'
import * as THREE from 'three'

export default class Game extends Component {
  componentDidMount() {
    // === THREE.JS CODE START ===
    let hemisphereLight,
      shadowLight,
      ambientLight,
      scene,
      camera,
      renderer,
      // objects
      geometry,
      material,
      cube,
      HEIGHT,
      WIDTH

    const createScene = function() {
      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      )
      renderer = new THREE.WebGLRenderer()
      renderer.setSize(window.innerWidth, window.innerHeight)
      document.addEventListener('resize', handleWindowResize, false)
    }

    function handleWindowResize() {
      // Update height and width of renderer and camera
      HEIGHT = window.innerHeight
      WIDTH = window.innerWidth

      renderer.setSize(WIDTH, HEIGHT)

      camera.aspect = WIDTH / HEIGHT
      camera.updateProjectionMatrix()
    }

    const createLights = function() {
      // Hemisphere light with color gradient, first param = sky, second param = ground, third param = intensity
      hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9)

      // Directional Light shines from specific direction and acts like the sun (all rays are parallel)
      shadowLight = new THREE.DirectionalLight(0xffffff, 0.9)

      // an ambient light modifies the global color of a scene and makes the shadows softer
      ambientLight = new THREE.AmbientLight(0xdc8874, 0.5)
      scene.add(ambientLight)

      // Set direction of light
      shadowLight.position.set(150, 350, 350)

      // Allow shadow casting
      shadowLight.castShadow = true

      // Define the visible area of the projected shadow
      shadowLight.shadow.camera.left = -400
      shadowLight.shadow.camera.right = 400
      shadowLight.shadow.camera.top = 400
      shadowLight.shadow.camera.bottom = -400
      shadowLight.shadow.camera.near = 1
      shadowLight.shadow.camera.far = 1000

      // Define the resolution of the shadow; higher is better but more costly
      shadowLight.shadow.mapSize.width = 1024
      shadowLight.shadow.mapSize.height = 1024

      // Add light to the scene
      scene.add(hemisphereLight)
      scene.add(shadowLight)
    }

    const createObject = function() {
      geometry = new THREE.BoxGeometry(1, 1, 1)
      material = new THREE.MeshLambertMaterial({color: 0x00ff00})
      cube = new THREE.Mesh(geometry, material)
      scene.add(cube)
      camera.position.z = 5
    }

    const animate = function() {
      requestAnimationFrame(animate)
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
      renderer.render(scene, camera)
    }

    const init = function() {
      createLights()
      createObject()
      animate()
    }

    createScene()
    this.mount.appendChild(renderer.domElement)
    init()
    // === THREE.JS EXAMPLE CODE END ===
  }
  render() {
    var context = null // the Web Audio "context" object
    var midiAccess = null // the MIDIAccess object.
    var oscillator = null // the single oscillator
    var envelope = null // the envelope for the single oscillator
    var attack = 0.05 // attack speed
    var release = 0.05 // release speed
    var portamento = 0.05 // portamento/glide speed
    var activeNotes = [] // the stack of actively-pressed keys

    window.addEventListener('load', function() {
      // patch up prefixes
      window.AudioContext = window.AudioContext || window.webkitAudioContext

      context = new AudioContext()
      if (navigator.requestMIDIAccess)
        navigator.requestMIDIAccess().then(onMIDIInit, onMIDIReject)
      else
        alert(
          "No MIDI support present in your browser.  You're gonna have a bad time."
        )

      // set up the basic oscillator chain, muted to begin with.
      oscillator = context.createOscillator()
      oscillator.frequency.setValueAtTime(110, 0)
      envelope = context.createGain()
      oscillator.connect(envelope)
      envelope.connect(context.destination)
      envelope.gain.value = 0.0 // Mute the sound
      oscillator.start(0) // Go ahead and start up the oscillator
    })

    function onMIDIInit(midi) {
      midiAccess = midi
      console.log(midiAccess)
      // Hook the message handler for all MIDI inputs
      for (let input of midiAccess.inputs.values()) {
        input.onmidimessage = MIDIMessageEventHandler
      }
    }

    function onMIDIReject(err) {
      if (err)
        console.log(
          "The MIDI system failed to start.  You're gonna have a bad time."
        )
    }

    function MIDIMessageEventHandler(event) {
      // Mask off the lower nibble (MIDI channel, which we don't care about)
      switch (event.data[0] & 0xf0) {
        case 0x90:
          if (event.data[2] != 0) {
            // if velocity != 0, this is a note-on message
            noteOn(event.data[1])
            return
          }
        // if velocity == 0, fall thru: it's a note-off.  MIDI's weird, ya'll.
        case 0x80:
          noteOff(event.data[1])
          
      }
    }

    function frequencyFromNoteNumber(note) {
      return 440 * Math.pow(2, (note - 69) / 12)
    }

    function noteOn(noteNumber) {
      activeNotes.push(noteNumber)
      oscillator.frequency.cancelScheduledValues(0)
      oscillator.frequency.setTargetAtTime(
        frequencyFromNoteNumber(noteNumber),
        0,
        portamento
      )
      envelope.gain.cancelScheduledValues(0)
      envelope.gain.setTargetAtTime(1.0, 0, attack)

      console.log(noteNumber)
    }

    function noteOff(noteNumber) {
      var position = activeNotes.indexOf(noteNumber)
      if (position !== -1) {
        activeNotes.splice(position, 1)
      }
      if (activeNotes.length === 0) {
        // shut off the envelope
        envelope.gain.cancelScheduledValues(0)
        envelope.gain.setTargetAtTime(0.0, 0, release)
      } else {
        oscillator.frequency.cancelScheduledValues(0)
        oscillator.frequency.setTargetAtTime(
          frequencyFromNoteNumber(activeNotes[activeNotes.length - 1]),
          0,
          portamento
        )
      }
    }
    return (
      <div>
        <button
          type="button"
          onClick={() =>
            context.resume().then(() => console.log('AUDIO CONTEXT RESUMED'))
          }
        >
          START
        </button>
        <div ref={ref => (this.mount = ref)} />
      </div>
    )
  }
}
