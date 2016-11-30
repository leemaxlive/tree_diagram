import d3 from 'd3';
import $ from 'jquery';
import './style.css';
import './iconfont/icon/iconfont.js';
import './iconfont/tuding/iconfont.js';
import './iconfont/switch/iconfont.js';

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

interface Option{
    size?:number;
    data:DataNode;
    duration?:number;
    depthSelector?:string;
    initDepth?:number;
    pinSwitch?:string;
}

let defaultOption:Option = {
    size:34,
    data:null,
    duration:500,
    depthSelector:'',
    initDepth:2,
    pinSwitch:''
};

let svg:d3.Selection<any>;
let viewWidth:number;
let viewHeight:number;
let root:DataNode;
let depthSelector:JQuery;
let pinSwitch:JQuery;
let depth:number;
let deepest:number;
let duration:number;
let r:number;
let svgGroupPaddingTop:number;
let iconCircleR:number;
let iconWidth:number;
let iconHeight:number;
let svgGroup:d3.Selection<any>;

let pinCircleR:number;
let pinWidth:number;
let pinHeight:number;
let nodePined:TreeNode[];//记录被钉的节点
let isPinedAll:boolean;

let nodeToggled:TreeNode[];//记录变化节点
let firstSpreadNode:DataNode;

let tree:d3.layout.Tree<TreeNode>;

let nodesClassifiedByTreeLevel:TreeNode[][];//分层引用节点数据

let diagonal = d3.svg.diagonal<TreeNode>().projection(d=>[d.x,d.y]);
let zoom = d3.behavior.zoom()
    .scaleExtent([0.2,4])
    .on('zoom',()=>{
        let e = d3.event as d3.ZoomEvent;
        let scale = e.scale;
        let translate = e.translate;
        svgGroup.attr('transform',`translate(${translate[0]},${translate[1]+svgGroupPaddingTop}) scale(${scale})`)
    })

export default function treeDiagram(svgId:string,customOption:Option){//初始化函数
    let option:Option = $.extend({},defaultOption,customOption);
    checkOption(option,defaultOption);

    svg = d3.select(svgId);
    viewWidth = svg.attr('width').indexOf('%') == -1 ? Number(svg.attr('width')): $(svg[0]).parent().width()*parseFloat(svg.attr('width'))/100;
    viewHeight = svg.attr('height').indexOf('%') == -1 ? Number(svg.attr('height')): $(svg[0]).parent().height()*parseFloat(svg.attr('height'))/100;

    root = option.data;
    root.ox=viewWidth/2;
    root.oy=0;

    nodesClassifiedByTreeLevel = [];
    deepest=0;
    formatData(root);
    
    r = option.size;
    // let nodeIntervalY = 250;
    duration = option.duration;
    svgGroupPaddingTop = 2*r;
    iconCircleR = r*0.5;
    iconWidth = 1.3*iconCircleR;
    iconHeight = 1.3*iconCircleR;

    pinCircleR = r*0.4;
    pinWidth = pinCircleR*1.5;
    pinHeight = pinCircleR*1.5;
    isPinedAll=false;
    nodePined=[];
    
    nodeToggled=[];
    firstSpreadNode=null;


    svg.attr('oncontextmenu','return false').call(zoom);
    svgGroup = svg.append('g').attr('transform',`translate(0,${svgGroupPaddingTop})`);
    tree = d3.layout.tree<TreeNode>()
        .size([viewWidth,viewHeight-(svgGroupPaddingTop+2*r)])
        .separation((a,b)=>99999*r)//相邻节点尽量分开

    depth = 1;
    toggleAll(root);
    nodeToggled = [];
    
    depth = option.initDepth;
    toggleAll(root);
    update(updateNodesData(),nodeToggled);
    
    depthSelector = $(option.depthSelector);
    if(depthSelector && depthSelector.length >0){
        appendDepthSelectorOption();
        depthSelector.change(function(){
            depth = Number($(this).val());
            if(depth==0) return;
            toggleAll(root);
            update(updateNodesData(),nodeToggled);
        })
    }

    pinSwitch = $(option.pinSwitch);
    if(pinSwitch && pinSwitch.length > 0)
        pinSwitch.on('click',function(){
            if(!isPinedAll){
                nodePined = [];
                nodesClassifiedByTreeLevel.forEach(nodes=>{
                    nodes.forEach(node=>nodePined.push(node))
                })
                isPinedAll = true;
            }else{
                nodePined = [];
                isPinedAll = false;
            }
            update(updateNodesData(),nodeToggled);
        })
}

//每DataNode节点初始化一个_children属性
function formatData(d:DataNode){
    d._children = [];

    if(!nodesClassifiedByTreeLevel[d.treeLevel-1])
        nodesClassifiedByTreeLevel[d.treeLevel-1]=[];
    nodesClassifiedByTreeLevel[d.treeLevel-1].push(d);
    
    if(d.children){
        d.children.forEach(formatData)
        if(deepest < d.treeLevel) deepest = d.treeLevel;
    }
}

//逐层递归进入到数据最后一层,进入到最后，向上逐层执行剩余语句
function toggleAll(d:DataNode){
    if(d.children && d.children.length>0){//该层为展开层
        d.children.forEach(toggleAll);
        //如果该层大于等于指定层将其收起，小于指定层时不做处理
        if(d.treeLevel>=depth){
            toggle(d);
            //由于鼠标点击时不是层层收起，而只是收起点击层，形成数据不是层层收起。而select选择层会让该层收起，但不一定是所要记录的变化点，也可能是招标点击的收起点
            //判断该变化节点是指定层且它以上的层都是展开的（!firstSpreadNode），则该层就是所要记录的变化点，用nodeToggled记录
            if(d.treeLevel==depth && !firstSpreadNode)
                nodeToggled.push(d);
        }
    }else if(d._children.length>0){//该层为收起层
        if(!firstSpreadNode) firstSpreadNode = d;//按递归顺序，记录每一个分支的第一个要展开的节点!!!
        d._children.forEach(toggleAll);
        //如果该层小于指定层将其展开
        if(d.treeLevel<depth){
            toggle(d);
            //判断该变化节点是否为firstSpreadNode记录的节点，如果是则用nodeToggled记录，并重置firstSpreadNode记录，用于下一个递归分支!!!
            if(d.viewId == firstSpreadNode.viewId){
                nodeToggled.push(d);
                firstSpreadNode=null;
            }
        }else if(d.treeLevel >= depth){//如果该层不小于指定层则不展开，就不用nodeToggled记录，但如果该层又是firstSpreadNode时重置firstSpreadNode记录（相邻层收起是这样的情况）
            if(d.viewId == firstSpreadNode.viewId)
                firstSpreadNode=null;
        }
    }
    //解除大于等于指定层的pined节点
    if(d.treeLevel > depth)
        filtNodePined(d);
}

function toggle(d:DataNode){
    if(d.children && d.children.length>0){
        d._children = d.children;
        d.children = [];
    }else{
        d.children = d._children;
        d._children = [];
    }
}

function updateNodesData(){
    let nodes = tree.nodes(root);
    if(nodePined.length>0){
        nodePined.forEach(node=>{
            shiftNodes(node)
        })
    }
    return nodes;
}

function update(nodes:TreeNode[],src:TreeNode[]){//变化的节点
    let nodeUpdate = svgGroup.selectAll('g.node').data(nodes,d=>d.viewId.toString());//通过唯一标识来更新数据，否则按datum参数遍历的顺序来更新（树形结构的数据遍历顺序会让更新不对应）
    
    let nodeGroup = nodeUpdate.enter()//新增的节点变形并置于src原位置节点上
        .append('g')
        .style('fill-opacity',0.01)
        .style('stroke-opacity',0.01)
        .attr('class','node')
        .on('mouseenter',function(){
            poListNodeShow(); 
            shiftNodes(d3.select(this).datum());
            update(svgGroup.selectAll('g.node').data(),nodeToggled);
        })
        .on('mouseleave',()=>{
            poListNodeHide();
            update(updateNodesData(),nodeToggled);
        })
        .attr('transform',d=>{
            let o = d.parent;
            let translate:string;
            for(let item of src){
                function tempFn(d:TreeNode){
                    if(d && d.viewId != item.viewId)
                        tempFn(d.parent as TreeNode);
                    else if(d && d.viewId == item.viewId)
                        translate = `translate(${item.ox},${item.oy}) scale(0.01)`;
                }
                tempFn(d);
            }
            return translate;
        })
    let mainNodeGroup = nodeGroup.append('g').attr('class','mainNode');
    mainNodeGroup.append('title').text(d=>d.title);
    mainNodeGroup.append('circle').attr('r',r).on('click',d=>{//切换展开或收起被点节点
        if(!d.children && d._children.length<1) return;
        if(depthSelector && depthSelector.length>0)
            resetDepthSelectorOption();
        filtChildNodePined(d,d.viewId);
        toggle(d);
        update(updateNodesData(),[d]);
    })
    mainNodeGroup.append('text').text(d=>d.title.length>5?d.title.slice(0,5)+'...':d.title);
    //选中所有主节点的circle,判断是否展开，并渐变切换颜色
    nodeUpdate.selectAll('.mainNode circle').attr('class',d=>d._children.length>0?'nodeContracted':'');
    
    //在新增的节点里添加poListNode
    nodeGroup.each((d,nodesGroupIndex)=>{
        for(let poListIndex = 0;poListIndex<d.poList.length;poListIndex++){
            let poListGroup = d3.select(nodeGroup[0][nodesGroupIndex]).insert('g','g')
                .attr('class','poListNode')
                .attr('transform',`translate(${(1+poListIndex)*r*0.2},0) rotate(-180)`)
            poListGroup.append('title').text(d=>d.poList[poListIndex].entityName);
            poListGroup.append('circle').attr('r',r)
            poListGroup.append('text').text(()=>{
                let entityName = d.poList[poListIndex].entityName;
                return entityName.length>5?d.title.slice(0,5)+'...':entityName;
            })

            //在最后一个polist上加图钉
            if(poListIndex == d.poList.length -1){
                let pinGroup = poListGroup.append('g')
                    .attr('class','pin')
                    .attr('transform',`translate(${r},0) rotate(90)`)
                    .on('click',()=>{
                        let e = d3.event as MouseEvent;
                        let currentPinGroup = d3.select(e.currentTarget);
                        let currentNodeGroup = d3.select($(e.currentTarget).closest('.node')[0]);
                        if(currentNodeGroup.attr('class').indexOf('pined') == -1){
                            currentNodeGroup.attr('class','node pined').on('mouseleave',null);
                            currentNodeGroup.attr('class','node pined').on('mouseenter',null);
                            currentPinGroup.attr('transform',`translate(${r},0) rotate(45)`).select('use').attr('xlink:href','#icon-tudingfill');
                            nodePined.push(currentNodeGroup.datum());
                        }else{
                            currentNodeGroup.attr('class','node').on('mouseleave',()=>poListNodeHide());
                            currentNodeGroup.attr('class','node').on('mouseenter',()=>poListNodeShow());
                            currentPinGroup.attr('transform',`translate(${r},0) rotate(90)`).select('use').attr('xlink:href','#icon-tudingkong');
                            
                            //取消全部PinedAll状态，nodePined只保留视图中仍为pined状态的节点，新生成的节点不会pined
                            isPinedAll=false;
                            nodePined = svgGroup.selectAll('.node.pined').data();
                            
                            filtNodePined(currentNodeGroup.datum());
                        }
                    })
                pinGroup.append('circle').attr('r',pinCircleR)
                pinGroup.append('use').attr('width',pinWidth)
                    .attr('height',pinHeight)
                    .attr('transform',`translate(${-pinWidth/2},${-pinHeight/2})`)
                    .attr('xlink:href','#icon-tudingkong')
            }
        }
    })

    //如果isPinedAll为true,则让全部polist展开
    //如果isPinedAll为false且视图还处在全部pined的状态，则polist全部收起
    if(isPinedAll)
        nodeUpdate[0].forEach(item=>{
            poListNodeShow(item);
            let currentNodeGroup = d3.select(item);
            let currentPinGroup = currentNodeGroup.select('.pin');
            currentNodeGroup.attr('class','node pined').on('mouseleave',null).on('mouseenter',null);
            currentPinGroup.attr('transform',`translate(${r},0) rotate(45)`).select('use').attr('xlink:href','#icon-tudingfill');
        })
    else if(!isPinedAll && nodeUpdate[0].every(item=>d3.select(item).attr('class') == 'node pined'))
        nodeUpdate[0].forEach(item=>{
            poListNodeHide(item);
            let currentNodeGroup = d3.select(item);
            let currentPinGroup = currentNodeGroup.select('.pin');
            currentPinGroup.attr('transform',`translate(${r},0) rotate(90)`).select('use').attr('xlink:href','#icon-tudingkong');
            currentNodeGroup.attr('class','node')
                .on('mouseenter',function(){
                    poListNodeShow(); 
                    shiftNodes(d3.select(this).datum());
                    update(svgGroup.selectAll('g.node').data(),nodeToggled);
                })
                .on('mouseleave',()=>{
                    poListNodeHide();
                    update(updateNodesData(),nodeToggled);
                })
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
        .style('fill-opacity',0.01)
        .style('stroke-opacity',0.01)
        .attr('transform',d=>{
            let translate:string;
            for(let item of src){
                function tempFn(d:TreeNode){
                    if(d && d.viewId != item.viewId)
                        tempFn(d.parent as TreeNode);
                    else if(d && d.viewId == item.viewId)
                        translate = `translate(${item.x},${item.y}) scale(0.01)`;
                }
                tempFn(d);
            }
            return translate;
        })
        .remove();

    let links = tree.links(nodes);
    let linkUpdate = svgGroup.selectAll('.link').data(links,d=>d.target.viewId.toString());//根据唯一标识更新数据
    
    //新增连线的起点和终点都是展开点
    linkUpdate.enter()
        .insert('path','g')
        .style('stroke-opacity',0.01)
        .attr('class','link')
        .attr('d',d=>{
            let position:{x:number,y:number};
            for(let item of src){
                function tempFn(d:TreeNode){
                    if(d && d.viewId != item.viewId)
                        tempFn(d.parent as TreeNode)
                    else if(d && d.viewId == item.viewId)
                        position={x:item.ox,y:item.oy}
                }
                tempFn(d.source)
            }
            let source = $.extend({},d.source,position);
            return diagonal({source,target:source});
        })
    
    //新增连线和已存在的线变形，位置回到新数据位置
    linkUpdate.transition().duration(duration)
        .attr('d',diagonal)
        .style('stroke-opacity',1);
    //多余的连线变形，使起点和终点都是src的新数据位置
    linkUpdate.exit().transition().duration(duration)
        .attr('d',d=>{
        let position:{x:number,y:number};
            for(let item of src){
                function tempFn(d:TreeNode){
                    if(d && d.viewId != item.viewId)
                        tempFn(d.parent as TreeNode)
                    else if(d && d.viewId == item.viewId)
                        position={x:item.x,y:item.y}
                }
                tempFn(d.source)
            }
            let source = $.extend({},d.source,position);
            return diagonal({source,target:source});
        })
        .style('stroke-opacity',0.01)
        .remove();
    
    //给节点数据挂上原位置坐标
    nodes.forEach(d=>{d.oy=d.y;d.ox=d.x});
    //重置变化节点记录
    nodeToggled=[];
}

function poListNodeShow(target?:EventTarget){
    let e = d3.event as MouseEvent;
    let currentSvgGroup:d3.Selection<any>;
    if(!target) currentSvgGroup = d3.select(e.target);
    else currentSvgGroup = d3.select(target);
    
    let poListGroup = currentSvgGroup.selectAll('.poListNode');
    poListGroup.transition().duration(duration)
        .attr('transform',(d,index)=>poListGroup[0].length < 2 ? `translate(${(Math.abs(poListGroup.length-index))*r*1.85},0) rotate(360)`:`translate(${(1+Math.abs(poListGroup.length-index))*r*1.85},0) rotate(360)`)
}
function poListNodeHide(target?:EventTarget){
    let e = d3.event as MouseEvent;
    let currentSvgGroup:d3.Selection<any>;
    if(!target) currentSvgGroup = d3.select(e.target);
    else currentSvgGroup = d3.select(target);
    
    let poListGroup = currentSvgGroup.selectAll('.poListNode');
    poListGroup.transition().duration(duration)
        .attr('transform',(d,index)=>poListGroup[0].length < 2 ?`translate(${(Math.abs(poListGroup.length-index))*r*0.2},0) rotate(-180)`:`translate(${(1+Math.abs(poListGroup.length-index))*r*0.2},0) rotate(-180)`)
}

function resetDepthSelectorOption(){
    depthSelector[0][0].selected = true;
}
function appendDepthSelectorOption(){
    for(let i = 0 ;i<deepest;i++){
        depthSelector.append(`<option value=${i+1}>${i+1}</option>`)
    }
    depthSelector.prepend(`<option value=${0}>请选择...</option>`)
    depthSelector[0][depth].selected = true;
}
function checkOption(option:Option,defaultOption:Option){
    Object.keys(option).forEach(d=>{
        if(d == 'data' && typeof option[d] != 'object')
            throw new Error('DATA MISSING')
    })
}

//偏移同层节点
function shiftNodes(d:TreeNode){
    let index:number;
    let moveTreeLevel = nodesClassifiedByTreeLevel[d.treeLevel-1];
    for(let i = 0 ; i < moveTreeLevel.length ; i++){
        if(d.viewId == moveTreeLevel[i].viewId){
            index = i;
            break;
        }
    }
    if(index ==  moveTreeLevel.length-1 || moveTreeLevel[index+1].x - moveTreeLevel[index].x >= (d.poList.length+1)*2*r + pinCircleR) 
        return;
    for(let i = 0 ; i < moveTreeLevel.length ; i++){
        if(i>index) moveTreeLevel[i].x = (d.poList.length+1)*2*r + pinCircleR + moveTreeLevel[i-1].x;
    }
    // moveTreeLevel[index+1].x = (d.poList.length+1)*2*r + pinCircleR + moveTreeLevel[index].x;
}

//解除参数节点的pined状态
function filtNodePined(d:TreeNode){
    if(!isPinedAll)
        nodePined = nodePined.filter(node=>node.viewId ==  d.viewId ? false:true)
}

//解除参数节点对应所有子节点的pined状态
function filtChildNodePined(node:TreeNode,parentId:number){
    if(node.children && node.children.length>0)
        node.children.forEach(node=>filtChildNodePined(node,parentId))
    else if(node._children.length>0)
        node._children.forEach(node=>filtChildNodePined(node,parentId))
    if(node.viewId != parentId)
        filtNodePined(node);
}
