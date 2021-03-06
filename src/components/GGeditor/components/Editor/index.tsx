import React from "react"
import isArray from "lodash/isArray"
import pick from "lodash/pick"
import Global from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/Global"
import {
    EditorEvent,
    GraphCommonEvent
} from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/constants"
import { CommandEvent } from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/interfaces"
import commandManager from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/commandManager"
import {
    EditorContext,
    EditorPrivateContext,
    EditorContextProps,
    EditorPrivateContextProps
} from "@/outter/fr-schema-antd-utils/src/components/GGeditor/components/EditorContext"

import "@/outter/fr-schema-antd-utils/src/components/GGeditor/components/Graph/shape/nodes/bizNode"

interface EditorProps {
    style?: React.CSSProperties
    className?: string
    [EditorEvent.onBeforeExecuteCommand]?: (e: CommandEvent) => void
    [EditorEvent.onAfterExecuteCommand]?: (e: CommandEvent) => void
}

interface EditorState extends EditorContextProps, EditorPrivateContextProps {}

class Editor extends React.Component<EditorProps, EditorState> {
    static setTrackable(trackable: boolean) {
        Global.setTrackable(trackable)
    }

    static defaultProps = {
        [EditorEvent.onBeforeExecuteCommand]: () => {},
        [EditorEvent.onAfterExecuteCommand]: () => {}
    }

    lastMousedownTarget: EventTarget | null = null

    constructor(props: EditorProps) {
        super(props)

        this.state = {
            graph: null,
            setGraph: this.setGraph,
            executeCommand: this.executeCommand
        }

        this.lastMousedownTarget = null
    }

    bindEvent(graph: G6.Graph) {
        const { props } = this

        graph.on<CommandEvent>(
            EditorEvent.onBeforeExecuteCommand,
            props[EditorEvent.onBeforeExecuteCommand]
        )
        graph.on<CommandEvent>(
            EditorEvent.onAfterExecuteCommand,
            props[EditorEvent.onAfterExecuteCommand]
        )
    }

    bindShortcut(graph: G6.Graph) {
        window.addEventListener(GraphCommonEvent.onMouseDown, e => {
            this.lastMousedownTarget = e.target
        })

        graph.on(GraphCommonEvent.onKeyDown, (e: any) => {
            const canvasElement = graph.get("canvas").get("el")

            if (this.lastMousedownTarget !== canvasElement) {
                return
            }

            Object.values(commandManager.command).some(async command => {
                const { name, shortcuts } = command

                const flag = shortcuts.some((shortcut: string | string[]) => {
                    const { key } = e

                    if (!isArray(shortcut)) {
                        return shortcut === key
                    }

                    return shortcut.every((item, index) => {
                        if (index === shortcut.length - 1) {
                            return item === key
                        }

                        return e[item]
                    })
                })

                if (flag) {
                    if (commandManager.canExecute(graph, name)) {
                        // Prevent default
                        e.preventDefault()

                        // Execute command
                        await this.executeCommand(name)

                        return true
                    }
                }

                return false
            })
        })
    }

    setGraph = (graph: G6.Graph) => {
        this.setState({
            graph
        })

        this.bindEvent(graph)
        this.bindShortcut(graph)
    }

    executeCommand = async (name: string, params?: object) => {
        const { graph } = this.state

        if (graph) {
            await commandManager.execute(graph, name, params)
        }
    }

    render() {
        const { children } = this.props
        const { graph, setGraph, executeCommand } = this.state

        return (
            <EditorContext.Provider
                value={{
                    graph,
                    executeCommand
                }}
            >
                <EditorPrivateContext.Provider
                    value={{
                        setGraph
                    }}
                >
                    <div {...pick(this.props, ["className", "style"])}>
                        {children}
                    </div>
                </EditorPrivateContext.Provider>
            </EditorContext.Provider>
        )
    }
}

export default Editor
