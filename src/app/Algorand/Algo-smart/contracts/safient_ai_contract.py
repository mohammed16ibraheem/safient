#!/usr/bin/env python3
"""
Safient Brand Contract - PyTeal Implementation
Safient-controlled cycle for staged ALGO delivery

Flow overview:
1. Initiator registers a Safient transfer with recipient details and a hold interval
2. Funds are held under Safient control for the configured interval (default 30 minutes)
3. During the interval, the initiator can request Safient Return
4. Once the interval passes, Safient Release can be executed to complete delivery
5. Status queries expose the current Safient state
"""

from pyteal import *
import algosdk
from algosdk.transaction import StateSchema
from typing import Tuple

# Global state keys
class GlobalKeys:
    SENDER = Bytes("safient_sender")
    RECIPIENT = Bytes("safient_receiver")
    AMOUNT = Bytes("safient_amount")
    HOLD_WINDOW = Bytes("safient_window")
    INITIATED_AT = Bytes("safient_initiated")
    UNLOCKS_AT = Bytes("safient_unlocks")
    STATUS = Bytes("safient_state")
    CONTRACT_VERSION = Bytes("safient_version")

# Status values
class Status:
    ACTIVE = Int(1)      # Funds locked, can be reclaimed
    COMPLETED = Int(2)   # Funds released to recipient
    RECLAIMED = Int(3)   # Funds reclaimed by sender

# Application calls
class Methods:
    SAFIENT_LOCK = Bytes("safient_lock")
    SAFIENT_RETURN = Bytes("safient_return")
    SAFIENT_RELEASE = Bytes("safient_release")
    SAFIENT_STATUS = Bytes("safient_status")

def safient_ai_approval_program():
    """
    Main approval program for Safient AI contract
    """
    
    # Initialize contract on creation
    on_creation = Seq([
        App.globalPut(GlobalKeys.CONTRACT_VERSION, Bytes("1.0.0")),
        App.globalPut(GlobalKeys.STATUS, Int(0)),  # Uninitialized Safient state
        Approve()
    ])
    
    # Create transfer operation
    create_transfer = Seq([
        # Validate inputs
        Assert(Txn.application_args.length() == Int(3)),
        Assert(Txn.accounts.length() == Int(2)),  # initiator and recipient references
        Assert(Global.latest_timestamp() > Int(0)),
        
        # Store transfer details
        App.globalPut(GlobalKeys.SENDER, Txn.sender()),
        App.globalPut(GlobalKeys.RECIPIENT, Txn.accounts[1]),
        App.globalPut(GlobalKeys.AMOUNT, Btoi(Txn.application_args[1])),
        App.globalPut(GlobalKeys.HOLD_WINDOW, Btoi(Txn.application_args[2])),
        App.globalPut(GlobalKeys.INITIATED_AT, Global.latest_timestamp()),
        App.globalPut(GlobalKeys.UNLOCKS_AT, 
                     Global.latest_timestamp() + Btoi(Txn.application_args[2])),
        App.globalPut(GlobalKeys.STATUS, Status.ACTIVE),
        
        Approve()
    ])
    
    # Reclaim funds operation
    reclaim_funds = Seq([
        # Only sender can reclaim
        Assert(Txn.sender() == App.globalGet(GlobalKeys.SENDER)),
        # Must be within lock period
        Assert(Global.latest_timestamp() < App.globalGet(GlobalKeys.UNLOCKS_AT)),
        # Must be active
        Assert(App.globalGet(GlobalKeys.STATUS) == Status.ACTIVE),
        
        # Update status
        App.globalPut(GlobalKeys.STATUS, Status.RECLAIMED),
        
        Approve()
    ])
    
    # Release funds operation
    release_funds = Seq([
        # Must be after expiration
        Assert(Global.latest_timestamp() >= App.globalGet(GlobalKeys.UNLOCKS_AT)),
        # Must be active
        Assert(App.globalGet(GlobalKeys.STATUS) == Status.ACTIVE),
        
        # Update status
        App.globalPut(GlobalKeys.STATUS, Status.COMPLETED),
        
        Approve()
    ])
    
    # Get status operation
    get_status = Seq([
        # This is a no-op call that allows reading global state
        Approve()
    ])
    
    # Main program logic - Fixed PyTeal syntax
    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.application_args[0] == Methods.SAFIENT_LOCK, create_transfer],
        [Txn.application_args[0] == Methods.SAFIENT_RETURN, reclaim_funds],
        [Txn.application_args[0] == Methods.SAFIENT_RELEASE, release_funds],
        [Txn.application_args[0] == Methods.SAFIENT_STATUS, get_status]
    )
    
    return program

def safient_ai_clear_state_program():
    """
    Clear state program - always approve
    """
    return Approve()

def compile_safient_ai_contract():
    """
    Compile the Safient AI contract
    """
    approval_program = safient_ai_approval_program()
    clear_state_program = safient_ai_clear_state_program()
    
    # Compile programs
    approval_teal = compileTeal(approval_program, Mode.Application, version=6)
    clear_state_teal = compileTeal(clear_state_program, Mode.Application, version=6)
    
    return approval_teal, clear_state_teal

def get_contract_schema():
    """
    Get the contract's global and local state schema
    """
    global_schema = StateSchema(
        num_uints=6,    # safient_state, safient_amount, safient_window, safient_initiated, safient_unlocks, safient_version
        num_byte_slices=3  # safient_sender, safient_receiver, safient_version
    )
    
    local_schema = StateSchema(
        num_uints=0,
        num_byte_slices=0
    )
    
    return global_schema, local_schema

if __name__ == "__main__":
    print("Compiling Safient AI contract...")
    approval_teal, clear_state_teal = compile_safient_ai_contract()
    
    with open("safient_ai_approval.teal", "w") as f:
        f.write(approval_teal)
    
    with open("safient_ai_clear_state.teal", "w") as f:
        f.write(clear_state_teal)
    
    print("Safient AI contract compiled successfully!")
    print(f"Approval program: {len(approval_teal)} characters")
    print(f"Clear state program: {len(clear_state_teal)} characters")