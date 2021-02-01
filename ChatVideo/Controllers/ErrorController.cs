using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ChatVideo.Controllers
{
    public class ErrorController : Controller
    {
        // GET: Error
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult NotFound(string aspxerrorpath)
        {
            if (!string.IsNullOrWhiteSpace(aspxerrorpath))
                return RedirectToAction("NotFound");

            return View();
        }
    }
}