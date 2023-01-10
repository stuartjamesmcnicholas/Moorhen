import { NavDropdown } from "react-bootstrap";
import { useState } from "react";
import { MoorhenBackgroundColorMenuItem, MoorhenClipFogMenuItem } from "./MoorhenMenuItem";


export const MoorhenViewMenu = (props) => {
    const [popoverIsShown, setPopoverIsShown] = useState(false)
    const menuItemProps = {setPopoverIsShown, ...props}

    return <>
            < NavDropdown 
                    title="View" 
                    id="view-nav-dropdown" 
                    style={{display:'flex', alignItems:'center'}}
                    autoClose={popoverIsShown ? false : 'outside'}
                    show={props.currentDropdownId === props.dropdownId}
                    onToggle={() => {props.dropdownId !== props.currentDropdownId ? props.setCurrentDropdownId(props.dropdownId) : props.setCurrentDropdownId(-1)}}>
                <MoorhenBackgroundColorMenuItem {...menuItemProps} />
                <MoorhenClipFogMenuItem {...menuItemProps} />
            </NavDropdown >
        </>
    }
