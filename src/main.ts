import treeDiagram from './app';

fetch('/data.json').then(res=>res.json()).then(data=>{
    treeDiagram('#svgDom',{
        data:data.gridViewTree[0],
        depthSelector:'.depthSelector',
        pinSwitch:'.switch'
    })
})