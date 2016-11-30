;(function(window) {

var svgSprite = '<svg>' +
  ''+
    '<symbol id="icon-switchoff" viewBox="0 0 1024 1024">'+
      ''+
      '<path d="M729.008 806.496 295.008 806.496C140.912 806.496 16 681.584 16 527.504l0-31.008c0-154.08 124.912-278.992 279.008-278.992l434 0c154.08 0 279.008 124.912 279.008 278.992l0 31.008C1008 681.584 883.088 806.496 729.008 806.496zM946 496.24c0-119.696-97.04-216.736-216.736-216.736L294.736 279.504c-119.696 0-216.736 97.04-216.736 216.736l0 31.536c0 119.696 97.04 216.736 216.736 216.736l434.528 0c119.696 0 216.736-97.04 216.736-216.736L946 496.24zM322.272 672.512c-90.576 0-164.016-73.632-164.016-164.448 0-90.832 73.44-164.448 164.016-164.448 90.592 0 164.016 73.632 164.016 164.448C486.288 598.88 412.864 672.512 322.272 672.512z"  ></path>'+
      ''+
    '</symbol>'+
  ''+
    '<symbol id="icon-switchon" viewBox="0 0 1024 1024">'+
      ''+
      '<path d="M729.008 806.496 295.008 806.496C140.912 806.496 16 681.584 16 527.504l0-31.008c0-154.08 124.912-278.992 279.008-278.992l434 0c154.08 0 279.008 124.912 279.008 278.992l0 31.008C1008 681.584 883.088 806.496 729.008 806.496zM946.96 496.768c0-119.696-97.04-216.736-216.736-216.736L294.384 280.032c-119.696 0-216.736 97.04-216.736 216.736l0 31.008c0 119.696 97.04 216.736 216.736 216.736L730.24 744.512c119.696 0 216.736-97.04 216.736-216.736L946.976 496.768zM702.32 672.576c-90.72 0-164.272-73.536-164.272-164.256 0-90.72 73.552-164.272 164.272-164.272 90.72 0 164.272 73.536 164.272 164.272C866.592 599.04 793.04 672.576 702.32 672.576z"  ></path>'+
      ''+
    '</symbol>'+
  ''+
'</svg>'
var script = function() {
    var scripts = document.getElementsByTagName('script')
    return scripts[scripts.length - 1]
  }()
var shouldInjectCss = script.getAttribute("data-injectcss")

/**
 * document ready
 */
var ready = function(fn){
  if(document.addEventListener){
      document.addEventListener("DOMContentLoaded",function(){
          document.removeEventListener("DOMContentLoaded",arguments.callee,false)
          fn()
      },false)
  }else if(document.attachEvent){
     IEContentLoaded (window, fn)
  }

  function IEContentLoaded (w, fn) {
      var d = w.document, done = false,
      // only fire once
      init = function () {
          if (!done) {
              done = true
              fn()
          }
      }
      // polling for no errors
      ;(function () {
          try {
              // throws errors until after ondocumentready
              d.documentElement.doScroll('left')
          } catch (e) {
              setTimeout(arguments.callee, 50)
              return
          }
          // no errors, fire

          init()
      })()
      // trying to always fire before onload
      d.onreadystatechange = function() {
          if (d.readyState == 'complete') {
              d.onreadystatechange = null
              init()
          }
      }
  }
}

/**
 * Insert el before target
 *
 * @param {Element} el
 * @param {Element} target
 */

var before = function (el, target) {
  target.parentNode.insertBefore(el, target)
}

/**
 * Prepend el to target
 *
 * @param {Element} el
 * @param {Element} target
 */

var prepend = function (el, target) {
  if (target.firstChild) {
    before(el, target.firstChild)
  } else {
    target.appendChild(el)
  }
}

function appendSvg(){
  var div,svg

  div = document.createElement('div')
  div.innerHTML = svgSprite
  svg = div.getElementsByTagName('svg')[0]
  if (svg) {
    svg.setAttribute('aria-hidden', 'true')
    svg.style.position = 'absolute'
    svg.style.width = 0
    svg.style.height = 0
    svg.style.overflow = 'hidden'
    prepend(svg,document.body)
  }
}

if(shouldInjectCss && !window.__iconfont__svg__cssinject__){
  window.__iconfont__svg__cssinject__ = true
  try{
    document.write("<style>.svgfont {display: inline-block;width: 1em;height: 1em;fill: currentColor;vertical-align: -0.1em;font-size:16px;}</style>");
  }catch(e){
    console && console.log(e)
  }
}

ready(appendSvg)


})(window)
