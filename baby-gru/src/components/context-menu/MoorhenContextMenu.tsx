import styled, { css } from "styled-components";
import { ClickAwayListener, FormGroup, List, MenuItem, Tooltip } from '@mui/material';
import { MoorhenAddSimpleMenuItem } from "../menu-item/MoorhenAddSimpleMenuItem"
import { MoorhenGetMonomerMenuItem } from "../menu-item/MoorhenGetMonomerMenuItem"
import { MoorhenFitLigandRightHereMenuItem } from "../menu-item/MoorhenFitLigandRightHereMenuItem"
import { MoorhenImportFSigFMenuItem } from "../menu-item/MoorhenImportFSigFMenuItem";
import { MoorhenMergeMoleculesMenuItem } from "../menu-item/MoorhenMergeMoleculesMenuItem"
import { MoorhenBackgroundColorMenuItem } from "../menu-item/MoorhenBackgroundColorMenuItem"
import { cidToSpec, convertRemToPx } from "../../utils/MoorhenUtils";
import { getBackupLabel } from "../../utils/MoorhenTimeCapsule"
import React, { useEffect, useRef, useState, useCallback, MutableRefObject, RefObject } from "react";
import { Popover, Overlay, FormLabel, FormSelect, Button, Stack } from "react-bootstrap";
import { MoorhenAddAltConfButton } from "../button/MoorhenAddAltConfButton"
import { MoorhenAddTerminalResidueButton } from "../button/MoorhenAddTerminalResidueButton"
import { MoorhenAutofitRotamerButton } from "../button/MoorhenAutofitRotamerButton"
import { MoorhenFlipPeptideButton } from "../button/MoorhenFlipPeptideButton"
import { MoorhenConvertCisTransButton } from "../button/MoorhenConvertCisTransButton"
import { MoorhenSideChain180Button } from "../button/MoorhenSideChain180Button"
import { MoorhenRefineResiduesButton } from "../button/MoorhenRefineResiduesButton"
import { MoorhenDeleteButton } from "../button/MoorhenDeleteButton"
import { MoorhenMutateButton } from "../button/MoorhenMutateButton";
import { MoorhenEigenFlipLigandButton } from "../button/MoorhenEigenFlipLigandButton";
import { MoorhenJedFlipFalseButton } from "../button/MoorhenJedFlipFalseButton";
import { MoorhenJedFlipTrueButton } from "../button/MoorhenJedFlipTrueButton";
import { MoorhenRotamerChangeButton } from "../button/MoorhenRotamerChangeButton";
import { MoorhenRotateTranslateZoneButton } from "../button/MoorhenRotateTranslateZoneButton";
import { MoorhenDragAtomsButton } from "../button/MoorhenDragAtomsButton";
import { MoorhenRigidBodyFitButton } from "../button/MoorhenRigidBodyFitButton";
import { moorhen } from "../../types/moorhen";
import { JSX } from "react/jsx-runtime";
import { webGL } from "../../types/mgWebGL";

const ContextMenu = styled.div`
  position: absolute;
  border-radius: 5px;
  box-sizing: border-box;
  border-color: #4a4a4a;
  border-width: 1px;
  border-style: solid;
  ${({ top, left, backgroundColor, opacity }) => css`
    top: ${top}px;
    left: ${left}px;
    background-color: ${backgroundColor};
    opacity: ${opacity};
    `}
`;

const MoorhenPopoverOptions = (props: {
  showContextMenu: boolean;
  setShowOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  label: string;
  options: string[];
  extraInput: (arg0: MutableRefObject<any>) => JSX.Element;
  nonCootCommand?: (arg0: moorhen.Molecule, arg1: moorhen.ResidueSpec, arg2: string) => void;
  doEdit: (arg0: moorhen.cootCommandKwargs) => void;
  formatArgs: (arg0: string, arg1: MutableRefObject<any>) => moorhen.cootCommandKwargs;
  selectedMolecule: moorhen.Molecule;
  chosenAtom: moorhen.ResidueSpec; 
}) => {

  const selectRef = useRef<null | HTMLSelectElement>(null)
  const extraInputRef = useRef(null)
  
  const handleRightClick = useCallback(() => {
    if (props.showContextMenu) {
      props.setShowOverlay(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener("rightClick", handleRightClick);
    return () => {
        document.removeEventListener("rightClick", handleRightClick);
    };

}, [handleRightClick]);

  return <ClickAwayListener onClickAway={() => props.setShowOverlay(false)}>
          <Stack direction="vertical" gap={2}>
            <FormGroup>
              <FormLabel>{props.label}</FormLabel>
              <FormSelect ref={selectRef} defaultValue='TRIPLE'>
                  {props.options.map(optionName => {
                      return <option key={optionName} value={optionName}>{optionName}</option>
                  })}
              </FormSelect>
            </FormGroup>
            {props.extraInput(extraInputRef)}
            <Button onClick={() => {
              if (!props.nonCootCommand) {
                props.doEdit(props.formatArgs(selectRef.current.value, extraInputRef))
              } else {
                props.nonCootCommand(props.selectedMolecule, props.chosenAtom, selectRef.current.value)
              }
            }}>
              OK
            </Button>
          </Stack>
        </ClickAwayListener>
}

MoorhenPopoverOptions.defaultProps = {extraInput: () => null, nonCootCommand: false}

export const MoorhenContextMenu = (props: {
  urlPrefix: string;
  changeMaps: (arg0: moorhen.MolChange<moorhen.Map>) => void;
  activeMap: moorhen.Map;
  enableRefineAfterMod: boolean;
  defaultBondSmoothness: number;
  shortCuts: {[label: string]: moorhen.Shortcut} | string;
  isDark: boolean;
  showContextMenu: false | moorhen.AtomRightClickEventInfo;
  molecules: moorhen.Molecule[];
  windowWidth: number;
  windowHeight: number;
  timeCapsuleRef: React.RefObject<moorhen.TimeCapsule>;
  setShowContextMenu: React.Dispatch<React.SetStateAction<false | moorhen.AtomRightClickEventInfo>>;
  viewOnly: boolean;
  backgroundColor: [number, number, number, number];
  setBackgroundColor: React.Dispatch<React.SetStateAction<[number, number, number, number]>>;
  glRef: React.RefObject<webGL.MGWebGL>;
  maps: moorhen.Map[];
  commandCentre: RefObject<moorhen.CommandCentre>;
  enableTimeCapsule: boolean;
  changeMolecules: { (arg0: moorhen.MolChange<moorhen.Molecule>): void; (arg0: moorhen.MolChange<moorhen.Molecule>): void; }; 
  monomerLibraryPath: string;
}) => {

  const contextMenuRef = useRef(null)
  const quickActionsFormGroupRef = useRef<HTMLInputElement>(null)
  const [showOverlay, setShowOverlay] = useState<boolean>(false)
  const [overlayContents, setOverlayContents] = useState<null | JSX.Element>(null)
  const [overrideMenuContents, setOverrideMenuContents] = useState<boolean>(false)
  const [opacity, setOpacity] = useState<number>(1.0)
  const [toolTip, setToolTip] = useState<string>('')
  const backgroundColor = props.isDark ? '#858585' : '#ffffff' 
  
  let selectedMolecule: moorhen.Molecule
  let chosenAtom: moorhen.ResidueSpec
  if (props.showContextMenu && props.showContextMenu.buffer){
    selectedMolecule = props.molecules.find(molecule => molecule.buffersInclude(props.showContextMenu ? props.showContextMenu.buffer : null))
  }
  if (props.showContextMenu && props.showContextMenu.atom) {
    chosenAtom = cidToSpec(props.showContextMenu.atom.label)
  }

  let top = props.showContextMenu ? props.showContextMenu.pageY : null
  let left = props.showContextMenu ? props.showContextMenu.pageX : null
  const menuWidth = selectedMolecule && chosenAtom ? convertRemToPx(26) : convertRemToPx(7)
  const menuHeight = selectedMolecule && chosenAtom ? convertRemToPx(17) : convertRemToPx(7)
  
  if (props.windowWidth - left < menuWidth) {
    left -= menuWidth
  }
  if (props.windowHeight - top < menuHeight) {
    top -= menuHeight
  }
    
  let placement: "left" | "right" = "right"
  if (props.windowWidth * 0.5 < left){
    placement = 'left'
  }
  
  const menuPosition = {top, left, placement}

  const collectedProps = {selectedMolecule, chosenAtom, setOverlayContents, setShowOverlay, toolTip, setToolTip, setOpacity, setOverrideMenuContents, ...props}

  const handleCreateBackup = async () => {
    await props.timeCapsuleRef.current.updateDataFiles()
    const session = await props.timeCapsuleRef.current.fetchSession(false)
    const sessionString = JSON.stringify(session)
    const key = {
        dateTime: `${Date.now()}`,
        type: 'manual',
        molNames: session.moleculeData.map(mol => mol.name),
        mapNames: session.mapData.map(map => map.uniqueId),
        mtzNames: session.mapData.filter(map => map.hasReflectionData).map(map => map.associatedReflectionFileName)
    }
    const keyString = JSON.stringify({
      ...key,
      label: getBackupLabel(key)
    })
    await props.timeCapsuleRef.current.createBackup(keyString, sessionString)
    props.setShowContextMenu(false)
  }

  return <>
      <ContextMenu ref={contextMenuRef} top={overrideMenuContents ? convertRemToPx(4) : menuPosition.top} left={overrideMenuContents ? convertRemToPx(2) : menuPosition.left} backgroundColor={backgroundColor} opacity={opacity}>
        {overrideMenuContents ? 
        overrideMenuContents 
        :
              <ClickAwayListener onClickAway={() => !showOverlay && props.setShowContextMenu(false)}>
                  <List>
                    {
                    props.viewOnly ? 
                      <MoorhenBackgroundColorMenuItem setPopoverIsShown={() => { }} backgroundColor={props.backgroundColor} setBackgroundColor={props.setBackgroundColor}/>
                    :              
                    selectedMolecule && chosenAtom ?
                    <>
                     <MoorhenMergeMoleculesMenuItem glRef={props.glRef} molecules={props.molecules} setPopoverIsShown={() => {}} menuItemText="Merge molecule into..." popoverPlacement='right' fromMolNo={selectedMolecule.molNo}/>
                     <MoorhenImportFSigFMenuItem molecules={props.molecules} setPopoverIsShown={() => {}} selectedMolNo={selectedMolecule.molNo} maps={props.maps} commandCentre={props.commandCentre} />
                     <MenuItem disabled={!props.enableTimeCapsule} onClick={() => handleCreateBackup()}>Create backup</MenuItem>
                     <hr></hr>
                     <div style={{ display:'flex', justifyContent: 'center' }}>
                     <Tooltip title={toolTip}>
                     <FormGroup ref={quickActionsFormGroupRef} style={{ justifyContent: 'center', margin: "0px", padding: "0px", width: '26rem' }} row>
                      <MoorhenAutofitRotamerButton mode='context' {...collectedProps} />
                      <MoorhenFlipPeptideButton mode='context' {...collectedProps}/>
                      <MoorhenSideChain180Button mode='context' {...collectedProps}/> 
                      <MoorhenRefineResiduesButton mode='context' {...collectedProps}/> 
                      <MoorhenDeleteButton mode='context' {...collectedProps} />
                      <MoorhenMutateButton mode='context' {...collectedProps} />
                      <MoorhenAddTerminalResidueButton mode='context' {...collectedProps} />
                      <MoorhenRotamerChangeButton mode='context' {...collectedProps}/>
                      <MoorhenRigidBodyFitButton  mode='context' {...collectedProps}/>
                      <MoorhenEigenFlipLigandButton mode='context' {...collectedProps}/>
                      <MoorhenJedFlipFalseButton mode='context' {...collectedProps}/>
                      <MoorhenJedFlipTrueButton mode='context' {...collectedProps}/>
                      <MoorhenRotateTranslateZoneButton mode='context' {...collectedProps} />
                      <MoorhenDragAtomsButton mode='context' {...collectedProps} />
                      <MoorhenAddAltConfButton mode ='context' {...collectedProps} />
                      <MoorhenConvertCisTransButton mode='context' {...collectedProps} />
                     </FormGroup>
                     </Tooltip>
                     </div>
                    </>
                    :
                    <>
                      <MoorhenAddSimpleMenuItem setPopoverIsShown={() => {}} popoverPlacement={menuPosition.placement} glRef={props.glRef} molecules={props.molecules} />
                      <MoorhenGetMonomerMenuItem setPopoverIsShown={() => {}} popoverPlacement={menuPosition.placement} defaultBondSmoothness={0} glRef={props.glRef} molecules={props.molecules} commandCentre={props.commandCentre} changeMolecules={props.changeMolecules} monomerLibraryPath={props.monomerLibraryPath} />
                      <MoorhenFitLigandRightHereMenuItem setPopoverIsShown={() => {}} popoverPlacement={menuPosition.placement} defaultBondSmoothness={0} glRef={props.glRef} maps={props.maps} molecules={props.molecules} commandCentre={props.commandCentre} changeMolecules={props.changeMolecules} backgroundColor={props.backgroundColor} monomerLibraryPath={props.monomerLibraryPath} />
                      <MoorhenBackgroundColorMenuItem setPopoverIsShown={() => { }} popoverPlacement={menuPosition.placement} backgroundColor={props.backgroundColor} setBackgroundColor={props.setBackgroundColor}/>
                      <MenuItem disabled={!props.enableTimeCapsule} onClick={() => handleCreateBackup()}>Create backup</MenuItem>
                    </>
                     }
                    
                  </List>
        </ClickAwayListener>
        }
          </ContextMenu>
          <Overlay placement={menuPosition.placement} show={showOverlay} target={quickActionsFormGroupRef.current}>
              <Popover>
              <Popover.Body>
                {overlayContents}
              </Popover.Body>
            </Popover>          
          </Overlay>
          </>
        

}
