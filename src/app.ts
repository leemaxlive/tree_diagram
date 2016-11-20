import d3 from 'd3';
import data from './data';
import $ from 'jquery';
import './style.css';
import './iconfont/iconfont.js';
interface Node extends d3.layout.tree.Node{
    title:string;
    poList:{entityName:string}[]
}
let viewWidth = $(document).width();
let viewHeight = $(document).height();
let r = 40;
let svg = d3.select('#svgDom')
        .attr('width',viewWidth)
        .attr('height',viewHeight)
let svgGroup = svg.append('g').attr('transform','translate(0,100)');
let tree = d3.layout.tree<Node>().size([viewWidth,viewHeight-200]);
let nodes = tree.nodes(data.gridViewTree[0]);
let links = tree.links(nodes);
let diagonal = d3.svg.diagonal<Node>().projection(d=>[d.x,d.y]);

svgGroup.selectAll('.link')
    .data(links)
    .enter()
    .append('path')
    .attr('class','link')
    .attr('d',diagonal)
let nodesGroup = svgGroup.selectAll('g.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class','node')
    .attr('transform',d=>`translate(${d.x},${d.y})`)
nodesGroup.each((d,nodesGroupIndex)=>{
    for(let poListIndex = d.poList.length-1;poListIndex>-1;poListIndex--){
        let poListGroup = d3.select(nodesGroup[0][nodesGroupIndex]).append('g')
            .attr('class','poListNodes')
            .attr('transform',`translate(${(1+poListIndex)*10},0)`)
        poListGroup.append('circle').attr('r',r)
        poListGroup.append('text').attr('transform','translate(-20,4)').text(()=>{
            let entityName = d.poList[poListIndex].entityName;
            return entityName.length>5?d.title.slice(0,5)+'...':entityName;
        })
    }
})

nodesGroup.append('circle').attr('r',r);
nodesGroup.append('text').attr('transform','translate(-20,4)').text(d=>d.title.length>5?d.title.slice(0,5)+'...':d.title);

let icon = nodesGroup.append('g').attr('class','icon').attr('transform','translate(-30,-30)');
icon.append('circle').attr('r',15)
icon.append('use').attr('width',20)
    .attr('height',20)
    .attr('transform','translate(-10,-10)')
    .attr('xlink:href',d=>{
        let num = Math.random()*10;
        if(num > 8) return '#icon-coin';
        else if(num > 6) return '#icon-update';
        else if(num>4) return '#icon-audience';
        else if(num>2) return '#icon-cogwheel';
        else return '#icon-share';
    })

