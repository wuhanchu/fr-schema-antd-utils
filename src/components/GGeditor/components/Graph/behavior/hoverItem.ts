import { ItemState } from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/constants"
import { Behavior } from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/interfaces"
import behaviorManager from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/behaviorManager"

interface HoverItemBehavior extends Behavior {
    /** 处理鼠标进入 */
    handleItemMouseenter({ item }: { item: G6.Item }): void
    /** 处理鼠标移出 */
    handleItemMouseleave({ item }: { item: G6.Item }): void
}

const hoverItemBehavior: HoverItemBehavior = {
    getEvents() {
        return {
            "node:mouseenter": "handleItemMouseenter",
            "edge:mouseenter": "handleItemMouseenter",
            "node:mouseleave": "handleItemMouseleave",
            "edge:mouseleave": "handleItemMouseleave"
        }
    },

    handleItemMouseenter({ item }) {
        const { graph } = this

        graph.setItemState(item, ItemState.Active, true)
    },

    handleItemMouseleave({ item }) {
        const { graph } = this

        graph.setItemState(item, ItemState.Active, false)
    }
}

behaviorManager.register("hover-item", hoverItemBehavior)
