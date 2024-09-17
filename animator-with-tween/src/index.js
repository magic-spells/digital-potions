

import TweenCalculator from '../../tween-calculator/dist/tween-calculator.min.js'

import PhysicsAnimator from '../../physics-animator/dist/physics-animator.min'





const framesForward = [
  {
    percent: 0,
    styles: {
      transform: 'translateX(0px) translateY(0px) rotate(0deg) scale(1.0)',
      backgroundColor: '#ff0000',
      borderWidth: '1px',
      borderRadius: '0px',
      filter: 'blur(15px)'
    }
  },
  {
    percent: 50,
    styles: {
      transform: 'translateX(0px) translateY(0px) rotate(0deg) scale(1.0)',
      backgroundColor: '#ff0000',
      borderWidth: '1px',
      borderRadius: '0px',
      filter: 'blur(10px)'
    }
  },
  {
    percent: 100,
    styles: {
      transform: 'translateX(400px) translateY(400px) rotate(-360deg) scale(2.0)',
      backgroundColor: '#ff00ff',
      borderWidth: '10px',
      borderRadius: '30px',
      filter: 'blur(0px)'
    }
  }
];


const framesBack = [
   {
    percent: 0,
    styles: {
      transform: 'translateX(400px)  translateY(400px) rotate(-720deg) scale(2.0)',
      backgroundColor: '#ff00ff',
      borderWidth: '10px',
      borderRadius: '30px'
    }
  },
  {
    percent: 100,
    styles: {
      transform: 'translateX(50px)  translateY(50px) rotate(0deg) scale(0.5)',
      backgroundColor: '#f0f000',
      borderWidth: '1px',
      borderRadius: '0px'
    }
  }
];








const animator = new PhysicsAnimator({ attraction: 0.01, friction: 0.03});

const tweenCalculator = new TweenCalculator(framesForward);
const box = document.getElementById('box')
const go = document.getElementById('go')

function updateView({ position, progress }) {
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
  // change to original set of frames
  tweenCalculator.setKeyframes(framesForward) 
  animator.animateTo(0, 500, 20, updateView)
    .then(() => {
      // wait a moment and run again 
      setTimeout(() => {
        // change to original set of frames
        tweenCalculator.setKeyframes(framesBack) 

        animator.animateTo(0, 500, 50, updateView);
      }, 100)
      
    });

})




// panel

const panelIn = [
   {
    percent: 0,
    styles: {
      transform: 'scale(0.9)',
      filter: 'blur(15px) opacity(0)'

    }
  },
  {
    percent: 100,
    styles: {
      transform: 'scale(1.0)',
      filter: 'blur(0px) opacity(1)'
    }
  }
];

const panelSlideIn = [
   {
    percent: 0,
    styles: {
      transform: 'translateX(100%) scale(1.0)',
      filter: 'blur(15px) opacity(1.0)'

    }
  },
  {
    percent: 95,
    styles: {
      transform: 'translateX(5%) scale(1.0)',
      filter: 'blur(0px) opacity(1)'
    }
  },
  {
    percent: 100,
    styles: {
      transform: 'translateX(0%) scale(1.0)',
      filter: 'blur(0px) opacity(1)'
    }
  }
];



const panelOut = [
  {
    percent: 0,
    styles: {
      transform: 'translateX(0%) scale(1)',
      filter: 'blur(0px) opacity(1)'
    }
  },
  {
    percent: 100,
    styles: {
      transform: 'translateX(110%) scale(1.0)',
      filter: 'blur(15px) opacity(1.0)'

    }
  }
];


// { attraction = 0.026, friction = 0.28 } 
const panelAnimator = new PhysicsAnimator({attraction: 0.038 });

const panel = document.getElementById('panel');
const panelInButton = document.getElementById('panel-in');
const panelOutButton = document.getElementById('panel-out');
const panelTween = new TweenCalculator(panelSlideIn);


function updatePanel ({ position, progress }) {
  const tweenStyles = panelTween.calculateTween(progress);
  // console.log(`update Panel ${progress}`, tweenStyles)
  applyTweenStyles(panel, tweenStyles);
}

panelInButton.addEventListener('click', function (argument) {
  panelTween.setKeyframes(panelSlideIn) 
  panelAnimator.animateTo(0, 400, 40, updatePanel)
});

panelOutButton.addEventListener('click', function (argument) {
  panelTween.setKeyframes(panelOut) 
  panelAnimator.animateTo(0, 360, 60, updatePanel)
});

// setTimeout(function(){
//   panelAnimator.animateTo(0, 500, 10, updatePanel)
//     .then(() => {
//       console.log('panel done')
//       panelTween.setKeyframes(panelOut) 
//     })
// }, 1000)


