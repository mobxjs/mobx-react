import React from "react"
import { configure, observable } from "mobx"
import { observer } from "../src"
import { render } from "@testing-library/react"
import withConsole from "./utils/withConsole";


@observer
class Issue806Component extends React.Component {
    render() {
        return null;
    }
}

test("verify issue 806", () => {
    configure({
        observableRequiresReaction: true
    });

    const x = observable({
        a: 1
    });

    withConsole(["warn"], () => {
        render(<Issue806Component />);
        expect(console.warn).not.toHaveBeenCalled()
    })

    // make sure observableRequiresReaction is still working outside component
    withConsole(["warn"], () => {
        x.a.toString();
        expect(console.warn).toBeCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith("[mobx] Observable ObservableObject@1.a being read outside a reactive context");
    })
})
