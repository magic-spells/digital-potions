

import TweenCalculator from '../../tween-calculator/dist/tween-calculator.min.js'

import PhysicsAnimator from '../../physics-animator/dist/physics-animator.min'



const animator = new PhysicsAnimator({ attraction: 0.01, friction: 0.05});


const framesForward = [
  {
    percent: 0,
    styles: {
      transform: 'translateX(0px)  rotate(0deg) scale(1.0)',
      backgroundColor: '#ff0000',
      opacity: 1.0,
      borderWidth: '1px'
    }
  },
  {
    percent: 50,
    styles: {
      transform: 'translateX(150px) rotate(-180deg) scale(0.5)',
      backgroundColor: '#00ff00',
      opacity: 0.1,
      borderWidth: '50px'
    }
  },
  {
    percent: 80,
    styles: {
      transform: 'translateX(300px) rotate(180deg) scale(1.6)',
      backgroundColor: '#0000ff',
      opacity: 0.8,
      borderWidth: '5px'
    }
  },
  {
    percent: 100,
    styles: {
      transform: 'translateX(500px) translateY(400px) rotate(-720deg) scale(2.0)',
      backgroundColor: '#ff00ff',
      opacity: 1,
      borderWidth: '0px'
    }
  }
];

const framesForward2 = [
  {
    percent: 0,
    styles: {
      transform: 'translateX(0px) translateY(0px) rotate(0deg) scale(1.0)',
      backgroundColor: '#ff0000',
      borderWidth: '1px'
    }
  },
  {
    percent: 100,
    styles: {
      transform: 'translateX(400px) translateY(400px) rotate(-360deg) scale(2.0)',
      backgroundColor: '#ff00ff',
      borderWidth: '10px'
    }
  }
];


const framesBack = [
   {
    percent: 0,
    styles: {
      transform: 'translateX(400px)  translateY(400px) rotate(-720deg) scale(2.0)',
      backgroundColor: '#ff00ff',
      borderWidth: '10px'
    }
  },
  {
    percent: 100,
    styles: {
      transform: 'translateX(50px)  translateY(50px) rotate(0deg) scale(0.5)',
      backgroundColor: '#f0f000',
      borderWidth: '1px'
    }
  }
];


const frames2 = [
   {
    percent: 0,
    styles: {
      backgroundColor: '#ff00ff',
      borderWidth: '0px'
    }
  },
  {
    percent: 50,
    styles: {

      backgroundColor: '#00ff00',
      borderWidth: '5px'
    }
  },
  {
    percent: 100,
    styles: {

      backgroundColor: '#ff0000',
      borderWidth: '10px'
    }
  }
];





const tweenCalculator = new TweenCalculator(framesForward2);
const box = document.getElementById('box')
const go = document.getElementById('go')

function updateView({ position, progress }) {
  // console.log('\nprogress', progress)
  const tweenStyles = tweenCalculator.calculateTween(progress);
  // console.log(`tweenStyles ${progress}`, tweenStyles)
  applyTweenStyles(box, tweenStyles);
}

function applyTweenStyles(element, styles) {
  for (const [prop, value] of Object.entries(styles)) {
    element.style[prop] = value;
  }
}


go.addEventListener('click', function (argument) {
  tweenCalculator.setKeyframes(framesForward2) 
  animator.animateTo(0, 500, 20, updateView)
    .then(() => {
      console.log('finished')
      tweenCalculator.setKeyframes(framesBack) 
      setTimeout(() => {
        animator.animateTo(0, 500, 50, updateView);
      }, 1000)
      
    });


})




