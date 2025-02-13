# ============= imports & variables ==============

import time
import logging
from datetime import datetime

log_time = datetime.now().strftime("%H:%M:%S") + " » "
interval = 10  # in seconds


# =============== data scraping =================

# get wait_time at interval
wait_time = 0
# get waiting_customers at interval
waiting_customers = 0
# get takes_current at interval
takes_current = 0
# get takes_fc at interval
takes_fc = 0


# ============= action functions =================


# skill inbound agents on inbound
def skill_inbound_on_inbound():
    print(log_time + "Skill: Inbound agents => Inbound")


# skill outbound agents on outbound
def skill_outbound_on_outbound():
    print(log_time + "Skill: Outbound agents => Outbound")


# skill outbound agents on inbound
def skill_outbound_on_inbound():
    print(log_time + "Skill: Outbound agents => Inbound")


# skill take inbound skills
def skill_take_inbound_skills():
    """Take inbound skills"""
    print(log_time + "Skill: Taking Inbound Skills")


# skill take outbound skills
def skill_take_outbound_skills():
    print(log_time + "Skill: Taking Outbound Skills")


# ================ bot logic ===================

if wait_time > 3:
    skill_take_outbound_skills()
    skill_outbound_on_inbound()
    skill_inbound_on_inbound()
elif wait_time < 2:
    skill_outbound_on_outbound()

if takes_current >= takes_fc and wait_time <= 0.5:
    skill_take_inbound_skills()
    skill_outbound_on_outbound()
