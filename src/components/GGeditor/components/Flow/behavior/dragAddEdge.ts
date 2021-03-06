import { guid } from "@/outter/fr-schema-antd-utils/src/components/GGeditor/utils"
import { GraphType } from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/constants"
import { Behavior, GraphEvent } from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/interfaces"
import behaviorManager from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/behaviorManager"

interface DragAddEdgeBehavior extends Behavior {
    edge?: G6.Edge
    addingEdge?: boolean
    sourceNode?: G6.Item
    isAnchor(e: GraphEvent): boolean
    notSelf(e: GraphEvent): boolean
    isOnlyOneEdge(e: G6.Node): boolean
    onMousedown(e: GraphEvent): void
    onMousemove(e: GraphEvent): void
    onMouseup(e: GraphEvent): void
    addEdgeCheck(ev: GraphEvent, flag: string): boolean
}

interface DefaultConfig {
    edgeType: string
    allowMultiEdge: boolean
}

const dragAddEdge: DragAddEdgeBehavior &
    ThisType<DragAddEdgeBehavior & DefaultConfig> = {
    graphType: GraphType.Flow,

    getDefaultCfg(): DefaultConfig {
        return { edgeType: "bizFlowEdge", allowMultiEdge: true }
    },

    getEvents() {
        return {
            "node:mousedown": "onMousedown",
            mousemove: "onMousemove",
            mouseup: "onMouseup"
        }
    },

    isAnchor(ev) {
        const { target } = ev
        const targetName = target.get("className")
        if (targetName == "anchor") return true
        else return false
    },

    notSelf(ev) {
        const node = ev.item
        const model = node.getModel()
        if (this.edge.getSource().get("id") === model.id) return false
        return true
    },

    // 两个节点之间，相同方向的线条只允许连一条
    isOnlyOneEdge(node) {
        if (this.allowMultiEdge) return true
        const source = this.edge.getSource().get("id")
        const target = node.get("id")
        if (!source || !target) return true
        return !node.getEdges().some(edge => {
            const sourceId = edge.getSource().get("id")
            const targetId = edge.getTarget().get("id")
            if (sourceId === source && targetId === target) return true
            else false
        })
    },

    addEdgeCheck(ev, inFlag = undefined) {
        // 如果点击的不是锚点就结束
        if (!this.isAnchor(ev)) return false
        // 出入度检查
        // return this.checkOutAndInEdge(ev.item, inFlag);
        return true
    },

    onMousedown(ev) {
        const { edgeType } = this
        if (!this.addEdgeCheck.call(this, ev, "out")) return
        const node = ev.item
        const graph = this.graph
        this.sourceNode = node

        graph.getNodes().forEach(n => {
            // 给其他所有节点加上 addingEdge 标识，
            // 让其 anchor 激活，表示可以连入
            if (n.get("id") !== node.get("id")) {
                // 判断节点是不是 sourceNode 的后继，否则不点亮锚点
                // if (!this.nextNodeCheck(node, n) || !this.checkOutAndInEdge(n, 'in')) graph.setItemState(n, 'limitLink', true);
                graph.setItemState(n, "addingEdge", true)
            } else graph.setItemState(n, "addingSource", true)
        })

        const point = { x: ev.x, y: ev.y }
        const model = node.getModel()
        // 点击节点，触发增加边
        if (!this.addingEdge && !this.edge) {
            const item = {
                id: guid(),
                label: "未配置",
                shape: edgeType,
                source: model.id,
                target: point,
                sourceAnchor: ev.target.get("index")
            }

            this.edge = graph.addItem("edge", item)
            this.addingEdge = true
        }
    },
    onMousemove(ev) {
        const { graph } = this
        if (this.addingEdge && this.edge) {
            const point = { x: ev.x, y: ev.y }
            // 鼠标放置到一个锚点上时，更新边
            // 否则只更新线的终点位置
            if (this.addEdgeCheck.call(this, ev, "in") && this.notSelf(ev)) {
                const node = ev.item
                const model = node.getModel()
                graph.updateItem(this.edge, {
                    targetAnchor: ev.target.get("index"),
                    target: model.id
                })
            } else graph.updateItem(this.edge, { target: point })
        }
    },
    onMouseup(ev) {
        const { graph, sourceNode } = this
        const node = ev.item as G6.Node
        // 隐藏所有节点的锚点
        const hideAnchors = () => {
            graph.setAutoPaint(false)
            graph.getNodes().forEach(n => {
                // 清楚所有节点状态
                n.clearStates("addingEdge")
                n.clearStates("limitLink")
                n.clearStates("addingSource")
            })
            graph.refreshItem(sourceNode)
            graph.paint()
            graph.setAutoPaint(true)
        }

        const removEdge = () => {
            graph.removeItem(this.edge)
            this.edge = null
            this.addingEdge = false
        }
        if (!this.addEdgeCheck.call(this, ev, "in")) {
            if (this.edge && this.addingEdge) {
                removEdge()
                hideAnchors()
            }
            return
        }

        const model = node.getModel()
        if (this.addingEdge && this.edge) {
            // 禁止自己连自己
            if (!this.notSelf(ev) || !this.isOnlyOneEdge(node)) {
                removEdge()
                hideAnchors()
                return
            }
            graph.setItemState(this.edge, "drag", false)
            graph.updateItem(this.edge, {
                targetAnchor: ev.target.get("index"),
                target: model.id
            })
            this.edge = null
            this.addingEdge = false
            hideAnchors()
        }
    }
}

behaviorManager.register("drag-add-edge", dragAddEdge)
