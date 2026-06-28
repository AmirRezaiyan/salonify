import logging
logger = logging.getLogger(__name__)


class SMSProvider:
    def send_sms(self, to, body):
        raise NotImplementedError


class MockSMSProvider(SMSProvider):
    def send_sms(self, to, body):
        logger.info(f"[MockSMS] to={to} body={body}")
        return True


# Twilio skeleton (credentials from env)
class TwilioSMSProvider(SMSProvider):
    def __init__(self, account_sid, auth_token, from_number):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number

    def send_sms(self, to, body):
        # TODO: implement with twilio client
        logger.info(f"[TwilioStub] to={to} body={body}")
        return True

# factory
import os
def get_sms_provider():
    provider = os.getenv('SMS_PROVIDER','mock')
    if provider == 'twilio':
        return TwilioSMSProvider(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'), os.getenv('TWILIO_FROM_NUMBER'))
    return MockSMSProvider()