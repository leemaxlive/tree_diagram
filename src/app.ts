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
    viewId:number;
}
type TreeNode = DataNode & d3.layout.tree.Node;
let root:DataNode;
let showDepth = 2;
let viewWidth = $(document).width();
let viewHeight = $(document).height();
let r = 40;
let nodeIntervalY = 250;
let i = 0;
let duration = 500;
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
    root.ox=viewWidth/2;
    root.oy=0;
    toggleAll(root);
    update(root);
})

function toggleAll(d:DataNode){
    d._children = [];//每DataNode节点初始化一个_children属性
    if(d.children){
        d.children.forEach(toggleAll)
        if(d.treeLevel >= showDepth) 
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

function update(src:TreeNode){//src展开或收起的节点
    let nodes = tree.nodes(root);
    // nodes.forEach(d=>d.y=d.depth*nodeIntervalY);//重置高度，让每一层在固定的高度

    let nodeUpdate = svgGroup.selectAll('g.node').data(nodes,d=>d.viewId.toString());//通过唯一标识来更新数据，否则按datum参数遍历的顺序来更新（树形结构的数据遍历顺序会让更新不对应）
    
    let nodeGroup = nodeUpdate.enter()//新增的节点变形并置于src原位置节点上
        .append('g')
        .attr('class','node')
        .attr('transform',d=>`translate(${src.ox},${src.oy}) scale(0.01)`)
        .style('fill-opacity',0.01)
        .style('stroke-opacity',0.01)
    let mainNodeGroup = nodeGroup.append('g').attr('class','mainNode');
    mainNodeGroup.append('title').text(d=>d.title);
    mainNodeGroup.append('circle').attr('r',r).on('click',d=>{//切换展开或收起被点节点
        if(!d.children && d._children.length<1) return;
        toggle(d);update(d);
    });
    mainNodeGroup.append('text').attr('style',`font-size:${fontSize}`).attr('transform',`translate(0,${fontSize/4})`).text(d=>d.title.length>5?d.title.slice(0,5)+'...':d.title);
    //选中所有主节点的circle,判断是否展开，并渐变切换颜色
    nodeUpdate.selectAll('.mainNode circle').transition().duration(duration).style('fill',d=>d._children.length>0?'#c7c7e2':'#d7ebff');
    
    //在新增的节点里添加poListNode
    nodeGroup.each((d,nodesGroupIndex)=>{
        for(let poListIndex = 0;poListIndex<d.poList.length;poListIndex++){
            let poListGroup = d3.select(nodeGroup[0][nodesGroupIndex]).insert('g','g')
                .attr('class','poListNode')
                .attr('transform',`translate(${(1+poListIndex)*r*0.2},0)`)
            poListGroup.append('circle').attr('r',r)
            poListGroup.append('text').attr('style',`font-size:${fontSize}`).attr('transform',`translate(0,${fontSize/4})`).text(()=>{
                let entityName = d.poList[poListIndex].entityName;
                return entityName.length>5?d.title.slice(0,5)+'...':entityName;
            })
        }
    })

    //在新增的节点里添加icon
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
    
    //新增的节点变形恢复原样，位置也恢复到新数据的位置上;已存在的节点也回到新数据的位置上
    nodeUpdate.transition().duration(duration)
        .attr('transform',d=>`translate(${d.x},${d.y}) scale(1)`)
        .style('fill-opacity',1)
        .style('stroke-opacity',1);
    
    //多余的节点变形，位置变到src新数据的位置上
    nodeUpdate.exit().transition().duration(duration)
        .attr('transform',d=>`translate(${src.x},${src.y}) scale(0.01)`)
        .style('fill-opacity',0.01)
        .style('stroke-opacity',0.01)
        .remove();
  
    let links = tree.links(nodes);
    let linkUpdate = svgGroup.selectAll('.link').data(links,d=>d.target.viewId.toString());//根据唯一标识更新数据

    linkUpdate.enter()
        .insert('path','g')
        .attr('class','link')
        .style('stroke-opacity',0.01)
        .attr('d',d=>{
            let source = $.extend({},d.source,{x:src.ox,y:src.oy});
            return diagonal({source,target:source});
        })//新增连线的起点和终点都是展开点
    
    //新增连线和已存在的线变形，位置回到新数据位置
    linkUpdate.transition().duration(duration)
        .attr('d',diagonal)
        .style('stroke-opacity',1);
    //多余的连线变形，使起点和终点都是src的新数据位置
    linkUpdate.exit().transition().duration(duration)
        .attr('d',d=>{
            return diagonal({source:src,target:src});
        })
        .style('stroke-opacity',0.01)
        .remove();
    
    //给节点数据挂上原位置坐标
    nodes.forEach(d=>{d.oy=d.y;d.ox=d.x});
}


