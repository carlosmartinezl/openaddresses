# -*- coding: utf-8 -*-
import logging

from pylons import request, response, session, tmpl_context as c
from pylons.controllers.util import abort, redirect_to

from pylons import config

from openaddresses.lib.base import *
from pylons.i18n.translation import *

log = logging.getLogger(__name__)

class HomeController(BaseController):

    available_languages = []

    current_lang = ''

    deactivate_cache = True

    def getAvailableLanguages(self):
        if not self.available_languages:
            self.available_languages = config['available_languages'].split(',')
        return self.available_languages

    def _isLangAvailable(self, lang):
        return lang in self.getAvailableLanguages()

    def __before__(self):

        update_session = True
        lang = None
        self.charset = 'utf-8'

        if 'lang' in request.params and self._isLangAvailable(request.params['lang']):
            lang = request.params['lang']
        elif 'lang' in session:
            lang = session['lang']
            update_session = False
        else:
            # get from user agent
            for language in request.languages:
                language = language[0:2]
                if self._isLangAvailable(language):
                    lang = unicode(language)
                    break
        if lang is None:
            lang = unicode(config['lang'])

        if 'charset' in request.params:
           self.charset = request.params['charset']

        set_lang(lang)
        if update_session:
            session['lang'] = lang
            session.save()

    def index(self):
        lang = str(get_lang())
        c.lang = self.current_lang = lang[3:5]
        c.charset = self.charset

        c.available_languages = self.getAvailableLanguages()

        if 'mode' in request.params:
            c.debug = (request.params['mode'].lower() == 'debug')
        else:
            c.debug = config['debug']
            
        # Return a rendered template
        return render('/index.mako')