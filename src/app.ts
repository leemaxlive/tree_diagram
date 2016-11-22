import d3 from 'd3';
import $ from 'jquery';
import './style.css';
import './iconfont/iconfont.js';

interface DataNode{
    title:string;
    poList:{entityName:string}[];
    children:DataNode[];
    _children:DataNode[];
    treeLevel:number;
    oy:number;
    ox:number;
    id:number
}
type TreeNode = DataNode & d3.layout.tree.Node;
let root:DataNode;
let showDepth = 4;
let viewWidth = $(document).width();
let viewHeight = $(document).height();
let r = 40;
let nodeIntervalY = 250;
let i = 0;
let svgGroupPaddingTop = 2*r;
let iconCircleR = r*0.35;
let iconWidth = r/2.2;
let iconHeight = r/2.2;
let fontSize = 16;
let svg = d3.select('#svgDom')
        .attr('width',viewWidth)
        .attr('height',viewHeight)
let svgGroup = svg.append('g').attr('transform',`translate(0,${svgGroupPaddingTop})`);
let tree = d3.layout.tree<TreeNode>().size([viewWidth,viewHeight-(svgGroupPaddingTop+2*r)]);
let diagonal = d3.svg.diagonal<TreeNode>().projection(d=>[d.x,d.y]);

fetch('/data.json').then(res=>res.json()).then(data=>{
    root = data.gridViewTree[0];
    toggleAll(root);
    update();
})

function toggleAll(d:DataNode){
    d._children = [];//每DataNode节点初始化一个_children属性
    if(d.children){
        d.children.forEach(toggleAll)
        // if(d.treeLevel >= showDepth) 
        toggle(d);
    }
}

function toggle(d:DataNode){
    if(d.children){
        d._children = d.children;
        d.children = [];
    }else{
        d.children = d._children;
        d._children = [];
    }
}

function update(src?:TreeNode){
    let nodes = tree.nodes(root).reverse();
    nodes.forEach(d=>d.y=d.depth*nodeIntervalY);

    let links = tree.links(nodes);
    // svgGroup.selectAll('.link').remove()
    let linkUpdate = svgGroup.selectAll('.link').data(links);
    linkUpdate.exit().remove();
    linkUpdate.enter()
        .append('path')
        .attr('class','link')
        .attr('d',diagonal);
    // svgGroup.selectAll('g.node').remove();
    let nodeUpdate = svgGroup.selectAll('g.node').data(nodes,function(d) { return d.id || (d.id = ++i); });;
    nodeUpdate.exit().remove();
    let nodeGroup = nodeUpdate.enter()
        .append('g')
        .attr('class','node')
        .attr('transform',d=>{
            return`translate(${src?src.ox-src.x+d.x:d.x},${d.y})`
        })
    nodeGroup.each((d,nodesGroupIndex)=>{
        for(let poListIndex = d.poList.length-1;poListIndex>-1;poListIndex--){
            let poListGroup = d3.select(nodeGroup[0][nodesGroupIndex]).append('g')
                .attr('class','poListNode')
                .attr('transform',`translate(${(1+poListIndex)*r*0.2},0)`)
            poListGroup.append('circle').attr('r',r)
            poListGroup.append('text').attr('style',`font-size:${fontSize}`).attr('transform',`translate(0,${fontSize/4})`).text(()=>{
                let entityName = d.poList[poListIndex].entityName;
                return entityName.length>5?d.title.slice(0,5)+'...':entityName;
            })
        }
    })

    let mainNodeGroup = nodeGroup.append('g').attr('class','mainNode');
    mainNodeGroup.append('title').text(d=>d.title);
    mainNodeGroup.append('circle')
        .attr('r',r).attr('class',d=>d._children.length>0?'nodeContracted':'')
        .on('click',d=>{toggle(d);update(d)})
    mainNodeGroup.append('text').attr('style',`font-size:${fontSize}`).attr('transform',`translate(0,${fontSize/4})`).text(d=>d.title.length>5?d.title.slice(0,5)+'...':d.title);

    let iconGroup = nodeGroup.append('g').attr('class','icon').attr('transform',`translate(${-r/4*3},${-r/4*3})`);
    iconGroup.append('circle').attr('r',iconCircleR)
    iconGroup.append('use').attr('width',iconWidth)
        .attr('height',iconHeight)
        .attr('transform',`translate(${-iconWidth/2},${-iconHeight/2})`)
        .attr('xlink:href',d=>{
            let num = Math.random()*10;
            if(num > 8) return '#icon-coin';
            else if(num > 6) return '#icon-update';
            else if(num>4) return '#icon-audience';
            else if(num>2) return '#icon-cogwheel';
            else return '#icon-share';
        })
    nodes.forEach(d=>{d.oy=d.y;d.ox=d.x});
}


