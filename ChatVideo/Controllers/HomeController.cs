using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ChatVideo.Controllers
{
    [HandleError]
    [Authorize]
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public JsonResult UploadFile(HttpPostedFileBase file)
        {
            try
            {
                if (file.ContentLength > 0)
                {
                    string _FileName = Path.GetFileName(file.FileName);
                    string _path = Path.Combine(Server.MapPath("~/Files"), _FileName);
                    file.SaveAs(_path);
                    return Json(new { status = "ok", filename = file.FileName });
                }
                return Json(new { status = "error", message = "file empty" });
            }
            catch
            {
                return Json(new { status = "error" });
            }
        }

        [HttpGet]
        public virtual ActionResult Download(string fileName)
        {
            //fileName should be like "photo.jpg"
            if (fileName != null)
            {
                string fullPath = Path.Combine(Server.MapPath("~/Files"), fileName);
                return File(fullPath, "application/octet-stream", fileName);
            }
            else
            {
                return RedirectToAction("Index", "Home");
            }
        }

    }
}